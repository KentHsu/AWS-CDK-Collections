import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

export class StaticSiteStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // create S3 bucket and host a static website
    const destinationBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })

    new s3deploy.BucketDeployment(this, 'HTMLBucketDeploy', {
      sources: [s3deploy.Source.asset('./website')],
      destinationBucket,
      cacheControl: [s3deploy.CacheControl.fromString('no-store, max-age=0')],
      prune: true,
    })

    // output website url
    new cdk.CfnOutput(this, 'bucketWebsiteUrl', {
      value: destinationBucket.bucketWebsiteUrl
    })
  }
}
