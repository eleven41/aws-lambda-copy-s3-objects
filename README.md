# An AWS Lambda Based Function to Copy S3 Objects

With this AWS Lambda function, you can copy objects from a source S3 bucket to one or more target S3 buckets as they are added to the source bucket.

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

1. Ensure you have a source and target bucket. They do not need to reside in the same region.
2. Configure your S3 buckets (see below)

### Building the Lambda Package

1. Clone this repo

```
git clone git@github.com:eleven41/aws-lambda-copy-s3-objects.git
cd aws-copy-encrypt-s3-objects
```

2. Install requirements

```
npm install async
npm install aws-sdk
```

3. Zip up the folder using your favourite zipping utility

### Lambda Function

1. Create a new Lambda function. 
2. Upload the ZIP package to your lambda function.
3. Add an event source to your Lambda function:
 * Event Source Type: S3
 * Bucket: your source bucket
 * Event Type: Object Created
4. Set your Lambda function to execute using the IAM role you created above.

### Configuration

Configuration is performed by setting tags on the source bucket.

Tag Name | Required
---|---
TargetBucket | Yes

**TargetBucket** - A space-separated list of buckets to which the objects will be copied. Optionally, the bucket names can contain a @ character followed by a region to indicate that the bucket resides in a different region.

For example: `my-target-bucket1 my-target-bucket1@us-west-2 my-target-bucket3@us-east-1`


At this point, if you upload a file to your source bucket, the file should be copied to the target bucket(s).
