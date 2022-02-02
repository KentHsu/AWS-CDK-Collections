import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';

export class ApiServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

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

  }
}
