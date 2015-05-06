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

### Lambda Function

1. Create a new Lambda function. 
2. Upload the file `index.js` as the code for your Lambda function.
3. Add an event source to your Lambda function:
 * Event Source Type: S3
 * Bucket: your source bucket
 * Event Type: Object Created

At this point, if you upload a file to your source bucket, the file should be copied to the target bucket.
