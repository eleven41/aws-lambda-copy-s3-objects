console.log("Version 0.2.0");

// Load up all dependencies
var AWS = require('aws-sdk');
var async = require('async');

// CreateS3
//
// Create a reference to an S3 client
// in the desired region.
function createS3(regionName) {
    var config = { apiVersion: '2006-03-01' };
    
    if (regionName != null)
        config.region = regionName;

    var s3 = new AWS.S3(config);
    return s3;
}

// This is the entry-point to the Lambda function.
exports.handler = function (event, context) {
    
    if (event.Records == null) {
        context.fail('Error', "Event has no records.");
        return;
    }
    
    // Process all records in the event asynchronously.
    async.each(event.Records, processRecord, function (err) {
        if (err) {
            context.fail('Error', "One or more objects could not be copied.");
        } else {
            context.succeed();
        }
    });
};

// processRecord
//
// Iterator function for async.each (called by the handler above).
//
// 1. Get the target bucket from the source bucket's tags
// 2. Copy the object to each of the desired buckets.
function processRecord(record, callback) {
        
    // The source bucket and source key are part of the event data
    var srcBucket = record.s3.bucket.name;
    var eventName = record.eventName;
    var srcKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
        
    // Get the target bucket(s) based on the source bucket.
    // Once we have that, perform the copy.
    getTargetBuckets(srcBucket, function (err, targets) {
        if (err) {
            console.log("Error getting target bucket: "); // an error occurred
            console.log(err, err.stack); // an error occurred
            callback("Error getting target bucket from source bucket '" + srcBucket + "'");
            return;
        }
        
        async.each(targets, function (target, callback) {

            var targetBucket = target.bucketName;
            var regionName = target.regionName;
            var targetBucketName = targetBucket;
            if (regionName != null)
                targetBucketName = targetBucketName + "@" + regionName;
            var targetKey = srcKey;
            
            console.log("Copying '" + srcKey + "' from '" + srcBucket + "' to '" + targetBucketName + "'");
            console.log(record);
            
            console.log(eventName); 
            if (eventName == "ObjectRemoved:DeleteMarkerCreated") {
                console.log("DELETE MARKER CREATED")
                var s3 = createS3(regionName);
                s3.deleteObject({
                    Bucket: targetBucket,
                    Key: targetKey
                },
                function (err, data) {
                    if (err) {
                        console.log("Error deleting '" + srcKey + "' from '" + srcBucket + "' to '" + targetBucketName + "'");
                        console.log(err, err.stack); // an error occurred
                        callback("Error deleting '" + srcKey + "' from '" + srcBucket + "' to '" + targetBucketName + "'");
                    } else {
                        callback();
                    }
                });
            }
            // Copy the object from the source bucket
            if (eventName == "ObjectCreated:Put") {
                var s3 = createS3(regionName);
                s3.copyObject({
                    Bucket: targetBucket,
                    Key: targetKey,
                    
                    CopySource: encodeURIComponent(srcBucket + '/' + srcKey),
                    MetadataDirective: 'COPY'
                }, function (err, data) {
                    if (err) {
                        console.log("Error copying '" + srcKey + "' from '" + srcBucket + "' to '" + targetBucketName + "'");
                        console.log(err, err.stack); // an error occurred
                        callback("Error copying '" + srcKey + "' from '" + srcBucket + "' to '" + targetBucketName + "'");
                    } else {
                        callback();
                    }
                });
            };
        }, function (err) {
            if (err) {
                callback(err);
            } else {
                callback();
            }
        });
    });
};

// getTargetBuckets
//
// Gets the tags for the named bucket, and
// from those tags, finds the "TargetBucket" tag.
// Once found, it calls the callback function passing
// the tag value as the single parameter.
function getTargetBuckets(bucketName, callback) {
    console.log("Getting tags for bucket '" + bucketName + "'");
    
    var s3 = createS3();
    s3.getBucketTagging({
        Bucket: bucketName
    }, function (err, data) {
        if (err) {
            if (err.code == 'NoSuchTagSet') {
                // No tags on the bucket, so the bucket is not configured properly.
                callback("Source bucket '" + bucketName + "' is missing 'TargetBucket' tag.", null);
            } else {
                // Some other error
                callback(err, null);
            }
            return;
        }
        
        console.log(data);
        var tags = data.TagSet;
        
        console.log("Looking for 'TargetBucket' tag");
        for (var i = 0; i < tags.length; ++i) {
            var tag = tags[i];
            if (tag.Key == 'TargetBucket') {
                console.log("Tag 'TargetBucket' found with value '" + tag.Value + "'");
                
                var tagValue = tag.Value.trim();
                var buckets = tag.Value.split(' ');
                
                var targets = [];
                
                for (var i = 0; i < buckets.length; ++i) {
                    var bucketSpec = buckets[i].trim();
                    if (bucketSpec.length == 0)
                        continue;
                    
                    var specParts = bucketSpec.split('@');
                    
                    var bucketName = specParts[0];
                    var regionName = specParts[1]

                    targets.push({ bucketName: bucketName, regionName: regionName });
                }
                
                callback(null, targets);
                return;
            }
        }
        
        callback("Tag 'TargetBucket' not found", null);
    });
}
