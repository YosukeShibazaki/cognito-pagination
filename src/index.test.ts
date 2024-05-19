import { test, describe, expect } from "@jest/globals";
import { UserType } from "@aws-sdk/client-cognito-identity-provider";
import { CognitoPagination } from "./";

const mockUsers: UserType[] = [
  {
    Username: "ichiro",
    Attributes: [{ Name: "email", Value: "ichiro@test.com" }],
    Enabled: true,
    UserStatus: "CONFIRMED",
  },
  {
    Username: "jiro",
    Attributes: [{ Name: "email", Value: "jiro@test.com" }],
    Enabled: false,
    UserStatus: "CONFIRMED",
  },
  {
    Username: "saburo",
    Attributes: [{ Name: "email", Value: "saburo@test.com" }],
    Enabled: true,
    UserStatus: "UNCONFIRMED",
  },
  {
    Username: "shiro",
    Attributes: [{ Name: "email", Value: "shiro@test.com" }],
    Enabled: false,
    UserStatus: "UNCONFIRMED",
  },
];

describe("CognitoPagination", () => {
  const client = new CognitoPagination();
  describe("filter", () => {
    test("not filter", () => {
      const users = client["filter"](mockUsers, {});
      expect(users.length).toBe(mockUsers.length);
    });

    test("filter by username", () => {
      const users1 = client["filter"](mockUsers, { username: "ichiro" }); // 特定の1件を取得
      expect(users1.length).toBe(1);
      const users2 = client["filter"](mockUsers, { username: "ro" }); // 部分一致の確認
      expect(users2.length).toBe(4);
    });

    test("filter by email", () => {
      const users1 = client["filter"](mockUsers, { email: "ichiro" });
      expect(users1.length).toBe(1);
      const users2 = client["filter"](mockUsers, { email: "ro" });
      expect(users2.length).toBe(4);
    });

    test("filter by enabeld", () => {
      const users = client["filter"](mockUsers, { enabled: true });
      expect(users.length).toBe(2);
    });

    test("filter by status", () => {
      const comfirmedUsers = client["filter"](mockUsers, { status: "CONFIRMED" });
      expect(comfirmedUsers.length).toBe(2);
      const resetRequiredUsers = client["filter"](mockUsers, { status: "RESET_REQUIRED" });
      expect(resetRequiredUsers.length).toBe(0);
    });

    test("filter by username and status", () => { // 複合条件
      const comfirmedUsers = client["filter"](mockUsers, { username: "ichiro", status: "CONFIRMED" });
      expect(comfirmedUsers.length).toBe(1);
      const unconfirmedUsers = client["filter"](mockUsers, { username: "ichiro", status: "UNCONFIRMED" });
      expect(unconfirmedUsers.length).toBe(0);
    });
  });

  describe("sort", () => {
    test("not sort", () => {
      const users = client["sort"](mockUsers, {});
      expect(users).toStrictEqual(mockUsers);
    });

    test("sort by email asc", () => {
      const users = client["sort"](mockUsers, { sortBy: "email", sortType: "ASC" });
      expect(users).toStrictEqual(mockUsers);
    });

    test("sort by email desc", () => {
      const users = client["sort"](mockUsers, { sortBy: "email", sortType: "DESC" });
      expect(users).toStrictEqual([
        {
          Username: "shiro",
          Attributes: [{ Name: "email", Value: "shiro@test.com" }],
          Enabled: false,
          UserStatus: "UNCONFIRMED",
        },
        {
          Username: "saburo",
          Attributes: [{ Name: "email", Value: "saburo@test.com" }],
          Enabled: true,
          UserStatus: "UNCONFIRMED",
        },
        {
          Username: "jiro",
          Attributes: [{ Name: "email", Value: "jiro@test.com" }],
          Enabled: false,
          UserStatus: "CONFIRMED",
        },
        {
          Username: "ichiro",
          Attributes: [{ Name: "email", Value: "ichiro@test.com" }],
          Enabled: true,
          UserStatus: "CONFIRMED",
        },
      ]);
    });

    test("sort by enabled asc", () => {
      const users = client["sort"](mockUsers, { sortBy: "enabled", sortType: "ASC" });
      expect(users.map(user => user.Enabled)).toStrictEqual([true, true, false, false]);
    });

    test("sort by enabled desc", () => {
      const users = client["sort"](mockUsers, { sortBy: "enabled", sortType: "DESC" });
      expect(users.map(user => user.Enabled)).toStrictEqual([false, false, true, true]);
    });

    test("sort by status asc", () => {
      const users = client["sort"](mockUsers, { sortBy: "status", sortType: "ASC" });
      expect(users.map(user => user.UserStatus)).toStrictEqual(["CONFIRMED", "CONFIRMED", "UNCONFIRMED", "UNCONFIRMED"]);
    });

    test("sort by status desc", () => {
      const users = client["sort"](mockUsers, { sortBy: "status", sortType: "DESC" });
      expect(users.map(user => user.UserStatus)).toStrictEqual(["UNCONFIRMED", "UNCONFIRMED", "CONFIRMED", "CONFIRMED"]);
    });

    test("sort by username asc", () => {
      const users = client["sort"](mockUsers, { sortBy: "username", sortType: "ASC" });
      expect(users).toStrictEqual(mockUsers);
    });

    test("sort by username desc", () => {
      const users = client["sort"](mockUsers, { sortBy: "username", sortType: "DESC" });
      expect(users.map(user => user.Username)).toStrictEqual(["shiro", "saburo", "jiro", "ichiro"]);
    });
  });

  describe("pagination", () => {
    test("get all", () => {
      const response = client["pagination"](mockUsers, {});
      expect(response.pageIndex).toBe(1);
      expect(response.totalPages).toBe(1);
      expect(response.totoalItems).toBe(mockUsers.length);
      expect(response.data).toStrictEqual(mockUsers);
    });

    test("get by 2 redords", () => {
      const response = client["pagination"](mockUsers, { page: 1, take: 2 });
      expect(response.pageIndex).toBe(1);
      expect(response.totalPages).toBe(Math.ceil(mockUsers.length / 2));
      expect(response.totoalItems).toBe(mockUsers.length);
      expect(response.data).toStrictEqual(mockUsers.slice(0, 2));
    });

    test("get by 2 redords and page 2", () => {
      const response = client["pagination"](mockUsers, { page: 2, take: 2 });
      expect(response.pageIndex).toBe(2);
      expect(response.totalPages).toBe(Math.ceil(mockUsers.length / 2));
      expect(response.totoalItems).toBe(mockUsers.length);
      expect(response.data).toStrictEqual(mockUsers.slice(2));
    });
  });
});