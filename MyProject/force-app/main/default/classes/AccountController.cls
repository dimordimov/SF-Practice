public with sharing class AccountController {
  @AuraEnabled(cacheable=true)
  public static List<Account> getAccounts() {
    try {
      return [
        SELECT Id, Name, Phone, AnnualRevenue 
        FROM Account
        ORDER BY Name
      ];
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  @AuraEnabled
  public static string createAccount(String accountObj) {
    try {
      AccountObj jsonReq = (AccountObj) JSON.deserialize(
        accountObj,
        AccountObj.class
      );

      Account account = new Account();
      account.Name = jsonReq.name;
      account.Phone = jsonReq.phone;
      account.AnnualRevenue = Decimal.valueOf(jsonReq.annualRevenue);

      insert account;

      JSONResponse response = new JSONResponse();
      response.Success = true;
      response.Account = account;

      return JSON.serialize(response);
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  @AuraEnabled
  public static String deleteAccount(Id accountId) {
    try {
      Account accountToDelete = [SELECT Id FROM Account WHERE Id = :accountId];
      delete accountToDelete;

      JSONResponse response = new JSONResponse();
      response.Success = true;
      response.Account = accountToDelete;

      return JSON.serialize(response);
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  public class AccountObj {
    @AuraEnabled
    public String name { get; set; }
    @AuraEnabled
    public String phone { get; set; }
    @AuraEnabled
    public String annualRevenue { get; set; }
  }

  public class JSONResponse {
    @AuraEnabled
    public Boolean Success { get; set; }
    @AuraEnabled
    public Account Account { get; set; }
  }
}
