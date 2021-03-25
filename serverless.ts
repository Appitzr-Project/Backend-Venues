import type { Serverless } from 'serverless/aws';

const serverlessConfiguration: Serverless = {
    service: 'backend-venues',
    frameworkVersion: '2',
    // Add the serverless-webpack plugin
    plugins: [
        'serverless-webpack',
        'serverless-domain-manager',
        'serverless-offline',
        'serverless-dotenv-plugin',
    ],
    provider: {
        name: 'aws',
        runtime: 'nodejs12.x',
        region: '${opt:region, "ap-southeast-2"}',
        stage: '${opt:stage, "dev"}',
        memorySize: 128,
        apiGateway: {
            minimumCompressionSize: 1024,
        },
        environment: {
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
            NODE_ENV: '${env:NODE_ENV}',
        },
        // Grant Access to DynamoDB
        iamRoleStatements: [
            {
                Effect: 'Allow',
                Action: [
                    "dynamodb:BatchGetItem",
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:BatchWriteItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem"
                ],
                Resource: [
                    'arn:aws:dynamodb:${opt:region, "ap-southeast-2"}:${env:AWS_ACCOUNT_ID}:table/${env:NODE_ENV}_UserFavorites',
                ],
            },
            {
                Effect: 'Allow',
                Action: [
                    "dynamodb:BatchGetItem",
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                ],
                Resource: [
                    'arn:aws:dynamodb:${opt:region, "ap-southeast-2"}:${env:AWS_ACCOUNT_ID}:table/${env:NODE_ENV}_VenueProfile',
                    'arn:aws:dynamodb:${opt:region, "ap-southeast-2"}:${env:AWS_ACCOUNT_ID}:table/${env:NODE_ENV}_VenueProfile/index/*',
                    'arn:aws:dynamodb:${opt:region, "ap-southeast-2"}:${env:AWS_ACCOUNT_ID}:table/${env:NODE_ENV}_UserProfile',
                ],
            }
        ],
    },
    functions: {
        app: {
            handler: 'handler.handler',
            events: [
                {
                    http: {
                        method: 'GET',
                        path: '/',
                        cors: {
                            origins: '*',
                            headers: '*',
                            allowCredentials: true
                        },
                    },
                },
                {
                    http: {
                        method: 'GET',
                        path: '/culture',
                        cors: {
                            origins: '*',
                            headers: '*',
                            allowCredentials: true
                        },
                    },
                },
                {
                    http: {
                        method: 'ANY',
                        path: '/favorites/{proxy+}',
                        cors: {
                            origins: '*',
                            headers: '*',
                            allowCredentials: true
                        },
                        authorizer: {
                            type: 'COGNITO_USER_POOLS',
                            name: 'Cognito-2',
                            arn: '${self:custom.project.cognito}',
                            identitySource: 'method.request.header.Authorization'
                        }
                    },
                },
                {
                    http: {
                        method: 'GET',
                        path: '/{proxy+}',
                        cors: {
                            origins: '*',
                            headers: '*',
                            allowCredentials: true
                        },
                    },
                },
            ],
        },
    },
    custom: {
        webpack: {
            webpackConfig: './webpack.config.js',
            includeModules: {
                forceExclude: [
                    'aws-sdk'
                ],
            },
        },
        project: {
            cognito: 'arn:aws:cognito-idp:${opt:region, "ap-southeast-2"}:${env:AWS_ACCOUNT_ID}:userpool/${env:COGNITO_POOL_ID}',
            dev: 'api.dev.appetizr.co',
            prod: 'api.appetizr.co',
        },
        customDomain: {
            domainName: '${self:custom.project.${opt:stage, "dev"}}',
            certificateName: '${self:custom.project.${opt:stage, "dev"}}',
            basePath: 'venues',
            stage: '${opt:stage, "dev"}',
            createRoute53Record: true,
            endpointType: 'regional',
            securityPolicy: 'tls_1_2',
            apiType: 'rest',
            autoDomain: false,
        },
        dotenv: {
            useDotenv: true,
            exclude: [
                'AWS_ACCESS_KEY_ID',
                'AWS_SECRET_ACCESS_KEY',
                'AWS_REGION',
                'DYNAMODB_LOCAL'
            ],
        },
    },
};

module.exports = serverlessConfiguration;
