// Load up all dependencies
var AWS = require('aws-sdk');

console.log("Version 0.1.0");

// get reference to S3 client 
var s3 = new AWS.S3();

// This is the entry-point to the Lambda function.
exports.handler = function (event, context) {
        
    // Process all records in the event.
    for (var i = 0; i < event.Records.length; ++i) {
        
        // The source bucket and source key are part of the event data
        var srcBucket = event.Records[i].s3.bucket.name;
        var srcKey = unescape(event.Records[i].s3.object.key);
        
        // Get the target bucket based on the source bucket.
        // Once we have that, perform the copy.
        getTargetBucket(srcBucket, function (targetBucket) {
            console.log("Copying '" + srcKey + "' from '" + srcBucket + "' to '" + targetBucket + "'");

            var dstBucket = targetBucket;
            var dstKey = srcKey;
            
            // Copy the object from the source bucket
            s3.copyObject({
                Bucket: dstBucket,
                Key: dstKey,
                
                CopySource: escape(srcBucket + '/' + srcKey),
                MetadataDirective: 'COPY'
            }, function (err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else console.log(data);           // successful response
            });
        });
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

                var buckets = tag.Value.split(";");

                for (var j = 0; j < buckets.length ; j++)
                {
                    var bucket = buckets[i].trim();

                    if (bucket.length > 0)
                    {
                        callback(bucket);
                    }
                }

                return;
            }
        }
        
        console.log("Tag 'TargetBucket' not found");
    });
}
