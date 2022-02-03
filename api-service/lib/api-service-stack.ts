import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

export class ApiServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

     /*
      * if you own a domain
      * 1. create Route53 hosted zone with the domain name (by aws cdk)
      * 2. copy/paste NS information to your domain register (manually)
      * else
      * 1. registered a domain on Route53 => mine is 'kenthsu.click'
      * 2. Route53 will automatically create a hosted zone for you
      */
    const domainName = 'kenthsu.click'
    // get route53 hosted zone (don't forget to setup env)
    const zone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName
    })

    // setup certificate
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: `*.${domainName}`,
      validation: acm.CertificateValidation.fromDns(zone),
    })

    // add API Gateway custom domain name
    const apigwDomainName = `apigateway.${domainName}`
    const api = new apigw.RestApi(this, "Endpoint", {
      domainName: {
        domainName: apigwDomainName,
        certificate,
      },
    })

    // setup A record to target API Gateway
    new route53.ARecord(this, 'DomainARecord', {
      recordName: apigwDomainName,
      zone,
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGateway(api)
      )
    })

    // define Lambda and HTTP handlers
    const indexHandler = new lambda.Function(this, "index", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("resources")
    });

    const getIndexIntegration  = new apigw.LambdaIntegration(indexHandler)
    const root = api.root
    root.addMethod("GET", getIndexIntegration)


    const helloHandler = new lambda.Function(this, "hello", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "hello.handler",
      code: lambda.Code.fromAsset("resources")
    });

    const getHelloIntegration  = new apigw.LambdaIntegration(helloHandler)
    const hello = api.root.addResource("hello")
    hello.addMethod("GET", getHelloIntegration)


    const getExampleIntegration = new apigw.HttpIntegration("http://example.com")
    const example = api.root.addResource("example")
    example.addMethod("GET", getExampleIntegration)

    // output domain name
    new cdk.CfnOutput(this, 'DomainName', {
      value: `https://${domainName}`
    })

  }
}
