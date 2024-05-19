import { CognitoIdentityProviderClient, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";

class Cognito {
  private client: CognitoIdentityProviderClient;
  constructor() {
    this.client = new CognitoIdentityProviderClient();
  }

  async listUsers(paginationToken?: string) {
    return await this.client.send(new ListUsersCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      PaginationToken: paginationToken,
    }));
  }
}

export const cognitoClient = new Cognito();