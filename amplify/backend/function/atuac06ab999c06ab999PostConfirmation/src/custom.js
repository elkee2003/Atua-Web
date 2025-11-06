const {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const {
  DynamoDBClient,
  PutItemCommand,
} = require("@aws-sdk/client-dynamodb");

const cognito = new CognitoIdentityProviderClient();
const dynamo = new DynamoDBClient();
const tableName = process.env.USERTABLE;

exports.handler = async (event) => {
  if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
    const userPoolId = event.userPoolId;
    const username = event.userName;
    const role = event.request.userAttributes["custom:role"];
    const sub = event.request.userAttributes.sub;
    const email = event.request.userAttributes.email;

    // ---- 1. Add user to Cognito group ----
    try {
      await cognito.send(
        new AdminAddUserToGroupCommand({
          GroupName: role,
          UserPoolId: userPoolId,
          Username: username,
        })
      );
      console.log(`✅ Added ${username} to group ${role}`);
    } catch (err) {
      console.error("❌ Error adding user to group:", err);
    }

    // ---- 2. Save user info to DynamoDB ----
    try {
      await dynamo.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            id: { S: sub },
            email: { S: email },
            role: { S: role },
          },
        })
      );
      console.log(`✅ User saved to DynamoDB: ${username}`);
    } catch (err) {
      console.error("❌ Error saving user to DynamoDB:", err);
    }
  }

  return event;
};
