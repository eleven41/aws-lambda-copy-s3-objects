// Load up all dependencies
var AWS = require('aws-sdk');

console.log("Version 0.1.0");

// This is the entry-point to the Lambda function.
exports.handler = function (event, context) {
    var seenErrors = [];
    var completedItems = 0;
    var itemsToUpload = 0;
    
    function checkForCompletion(error) {
        if (error) {
            seenErrors.push(error);
        }
        
        completedItems++;
        
        if (completedItems < itemsToUpload) {
            return;
        }
        
        if (seenErrors.length > 0) {
            context.fail("Failed to upload " + seenErrors.length  + " files of " + itemsToUpload
                + ". Check the logs for more information.");
        } else {
            context.succeed("Successfully uploaded " + completedItems + " files.");
        }
    }
    
    function processUploads(uploads) {
        itemsToUpload += uploads.length;
        
        for (var j = 0; j < uploads.length; j++) {
            var targetBucket = uploads[j].bucket;
            var region = uploads[j].region;
            
            console.log("Copying '" + srcKey + "' from '" + srcBucket + "' to '" + targetBucket + "' in " + region);
            
            var s3 = region === null ? new AWS.S3() : new AWS.S3({region: region});
            
            s3.copyObject({
                Bucket: targetBucket,
                Key: srcKey,
                
                CopySource: escape(srcBucket + '/' + srcKey),
                MetadataDirective: 'COPY'
            }, function (err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else console.log(data);           // successful response
                
                checkForCompletion(err)
            });    
        }
    }
    
    // Process all records in the event.
    for (var i = 0; i < event.Records.length; ++i) {
        
        // The source bucket and source key are part of the event data
        var srcBucket = event.Records[i].s3.bucket.name;
        var srcKey = unescape(event.Records[i].s3.object.key);
        
        // Get a list of  target buckets based on the source bucket.
        // Once we have that, perform the copy operations.
        getTargetBucket(srcBucket, processUploads);
    }
};

// getTargetBucket
//
// Gets the tags for the named bucket, and
// from those tags, finds the "TargetBucket" tag.
// Once found, it calls the callback function passing
// the tag value as the single parameter.
function getTargetBucket(bucketName, callback) {
    console.log("Getting tags for bucket '" + bucketName + "'");

    var s3 = new AWS.S3();

    s3.getBucketTagging({
        Bucket: bucketName
    }, function (err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            return;
        }
        
        console.log(data);
        var tags = data.TagSet;
        
        console.log("Looking for 'TargetBucket' tag");
        for (var i = 0; i < tags.length; ++i) {
            var tag = tags[i];
            if (tag.Key == 'TargetBucket') {
                console.log("Tag 'TargetBucket' found with value '" + tag.Value + "'");

                var uploads = [];
                var buckets = tag.Value.split(" ");

                for (var j = 0; j < buckets.length ; j++) {
                    var bucketIdentifier = buckets[j].trim();

                    if (bucketIdentifier.length == 0) {
                        continue;
                    }

                    var identifierParts = bucketIdentifier.split("@");

                    var bucket = identifierParts[0].trim();
                    var region = identifierParts.length > 1 ? identifierParts[1].trim() : null;

                    uploads.push({bucket: bucket, region: region});
                }
                
                callback(uploads);
                return;
            }
        }
        
        console.log("Tag 'TargetBucket' not found");
    });
}
