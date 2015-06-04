# An AWS Lambda Based Function to Copy S3 Objects

With this AWS Lambda function, you can copy objects from a source S3 bucket to a target S3 bucket as they are added to the source bucket.

## Configuration

### IAM Role

Create an IAM role with the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Stmt1430872797000",
            "Effect": "Allow",
            "Action": [
                "s3:GetBucketTagging",
                "s3:GetObject",
                "s3:PutObject"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Sid": "Stmt1430872844000",
            "Effect": "Allow",
            "Action": [
                "cloudwatch:*"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Sid": "Stmt1430872852000",
            "Effect": "Allow",
            "Action": [
                "logs:*"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
}
```

### S3 Buckets

Ensure you have a source and target bucket. They do not need to reside in the same region.

On the source bucket, add a tag named "TargetBucket" and give it a value of the name of the target bucket.

You can specify multiple buckets delimited by semicolons, e.g. `StagingBucket;DisasterRecoveryBucket;Etc`.

If the bucket is in another region, you will need to specify the region delimited with an `@` token,
e.g. `StagingBucket@eu-central-1;DisasterRecoveryBucket@eu-west-1;BucketInSameRegion;Etc`.

We don't use the API to retrieve the region of the bucket to avoid burning API usages
($0.004 x 1000 requests under heavy traffic can mount up faster than you'd imagine).

If you don't specify the region for a bucket that is outside the function's region,
you will see an error that looks like this:

> [PermanentRedirect: The bucket you are attempting to access must be addressed using the specified endpoint. Please send all future requests to this endpoint.

### Lambda Function

1. Create a new Lambda function. 
2. Upload the file `index.js` as the code for your Lambda function.
3. Add an event source to your Lambda function:
 * Event Source Type: S3
 * Bucket: your source bucket
 * Event Type: Object Created

At this point, if you upload a file to your source bucket, the file should be copied to the target bucket.
