import { UserStatusType,  UserType } from "@aws-sdk/client-cognito-identity-provider";
import _ from "lodash";
import { cognitoClient } from "./cognito";

type FilterProps = {
  email?: string;
  username?: string;
  enabled?: boolean;
  status?: UserStatusType;
  createdDateStart?: string; // yyyy-MM-dd
  createdDateEnd?: string;
  updatedDateStart?: string;
  updatedDateEnd?: string;
}

type SortProps = {
  sortBy?: "email" | "username" | "enabled" | "status";
  sortType?: "ASC" | "DESC";
}

type PaginationProps = {
  take?: number,
  page?: number,
}

type PaginationResponse = {
  data: UserType[];
  totoalItems: number;
  totalPages: number;
  pageIndex: number;
}

export class CognitoPagination {
  private client = cognitoClient;

  private async all() {
    let token: string | undefined;
    const data: UserType[] = [];
    do {
      const response = await this.client.listUsers(token);
      token = response.PaginationToken;
      if (response.Users) {
        data.push(...response.Users);
      }
    } while (token);
    return data;
  }

  async list({ filter, sort, pagination }: {
    filter?: FilterProps;
    sort?: SortProps;
    pagination: PaginationProps;
  }): Promise<PaginationResponse> {
    let users = await this.all();
    if (filter) {
      users = this.filter(users, filter);
    }
    if (sort) {
      users = this.sort(users, sort);
    }
    return this.pagination(users, pagination);
  }

  private filter(users: UserType[], props: FilterProps): UserType[] {
    return users.filter((user) => {
      const email = user.Attributes?.find(attr => attr.Name === "email")?.Value;
      if (
        (props.email ? (email?.includes(props.email)) : true) &&
        (typeof props.enabled === "boolean" ? (user.Enabled === props.enabled) : true) &&
        (props.status ? (user.UserStatus === props.status) : true) &&
        (props.username ? (user.Username?.includes(props.username)) : true)
        // TODO: 作成日時と更新日時でフィルター
      ) {
        return true;
      } else {
        return false;
      }
    });
  }

  private sort(users: UserType[], props: SortProps): UserType[] {
    const prev = props.sortType === "ASC" ? 1 : -1;
    const next = props.sortType === "DESC" ? 1 : -1;
    return users.sort((a, b) => {
      switch (props.sortBy) {
        case "email": {
          const emailA = a.Attributes?.find(attr => attr.Name === "email")?.Value;
          const emailB = b.Attributes?.find(attr => attr.Name === "email")?.Value;
          return (emailA ?? "") > (emailB ?? "") ? prev : next;
        }
        case "enabled": {
          const enabledA = a.Enabled ? 0 : 1;
          const enabledB = b.Enabled ? 0 : 1;
          return enabledA > enabledB ? prev : next;
        }
        case "status": {
          return (a.UserStatus ?? "") > (b.UserStatus ?? "") ? prev : next;
        }
        case "username": { // username
          return a.Username! > b.Username! ? prev : next;
        }
        // TODO: 作成日時、更新日時でソート
        default: {
          return 0
        }
      }
    });
  }

  private pagination(users: UserType[], props: PaginationProps): PaginationResponse {
    const chunks = _.chunk(users, (props.take ?? users.length));
    const pageIndex = (props.page ?? 1);
    return {
      totoalItems: users.length,
      totalPages: chunks.length,
      pageIndex,
      data: chunks[pageIndex - 1] || [],
    }
  }
}
