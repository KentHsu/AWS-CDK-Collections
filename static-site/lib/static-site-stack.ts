import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origin from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
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

    const domainName = 'kenthsu.click'
    // get route53 hosted zone
    // don't forget to setup env in bin/api_service.ts
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName
    })

    // get certificate, us-east-1 is a must
    const cloudFrontDomainName = `static.${domainName}`
    const certificate = new acm.DnsValidatedCertificate(this, 'CrossRegionCertificate', {
      domainName: cloudFrontDomainName,
      hostedZone,
      region: 'us-east-1',
    })

    const cloudfrontTarget = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origin.S3Origin(destinationBucket),
      },
      domainNames: [cloudFrontDomainName],
      certificate,
    })

    new route53.ARecord(this, 'DomainARecord', {
      recordName: cloudFrontDomainName,
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(cloudfrontTarget)
      ),
    })

    new cdk.CfnOutput(this, 'cloudFrontDomainName', {
      value: `https://${cloudFrontDomainName}`
    })


  }
}
