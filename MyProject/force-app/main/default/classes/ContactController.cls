public with sharing class ContactController {
  @AuraEnabled
  public static String createContact(String contactData) {
    ContactObj contactObj = (ContactObj) JSON.deserialize(
      contactData,
      ContactObj.class
    );

    Contact newContact = new Contact(
      FirstName = contactObj.firstName,
      LastName = contactObj.lastName,
      Phone = contactObj.phone,
      Email = contactObj.email,
      AccountId = contactObj.accountId
    );

    try {
      insert newContact;

      return JSON.serialize(newContact);
    } catch (Exception e) {
      System.debug('Error creating contact: ' + e.getMessage());
      throw new AuraHandledException(
        'Error creating contact: ' + e.getMessage()
      );
    }
  }

  @AuraEnabled(cacheable=true)
  public static Integer getContactsCount(
    String filterType,
    String filterValue
  ) {
    Set<String> validFields = new Set<String>{
      'Name',
      'Phone',
      'Email',
      'CreatedDate',
      'Account.Name',
      'IsSpecial'
    };

    String filterCondition = '';
    if (
      filterType != null &&
      filterValue != null &&
      !String.isEmpty(filterValue)
    ) {
      if (validFields.contains(filterType) && filterType != 'IsSpecial') {
        filterCondition =
          ' WHERE ' +
          filterType +
          ' LIKE \'%' +
          String.escapeSingleQuotes(filterValue) +
          '%\'';
      }

      if (validFields.contains(filterType) && filterType == 'IsSpecial') {
        filterCondition =
          ' WHERE Id IN (SELECT contactId__c FROM ContactExtraInfo__c WHERE isSpecial__c = ' +
          String.escapeSingleQuotes(filterValue) +
          ')';
      }
    }

    try {
      String query = 'SELECT Count() FROM Contact' + filterCondition;

      return Database.countQuery(query);
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  @AuraEnabled(cacheable=true)
  public static String getContacts(
    Integer pageNumber,
    Integer pageSize,
    String sortField,
    String sortOrder,
    String filterType,
    String filterValue
  ) {
    Integer offsetSize = (pageNumber - 1) * pageSize;

    Set<String> validFields = new Set<String>{
      'Name',
      'Phone',
      'Email',
      'CreatedDate',
      'Account.Name',
      'IsSpecial'
    };

    String defaultSortField = 'Name';
    String defaultSortOrder = 'ASC';

    String orderByField = validFields.contains(sortField)
      ? sortField
      : defaultSortField;

    String orderByOrder = (sortOrder != null &&
      (sortOrder.equalsIgnoreCase('ASC') || sortOrder.equalsIgnoreCase('DESC')))
      ? sortOrder
      : defaultSortOrder;

    String filterCondition = '';
    if (
      filterType != null &&
      filterValue != null &&
      !String.isEmpty(filterValue)
    ) {
      if (validFields.contains(filterType) && filterType != 'IsSpecial') {
        filterCondition =
          'WHERE ' +
          filterType +
          ' LIKE \'%' +
          String.escapeSingleQuotes(filterValue) +
          '%\'';
      }
      if (validFields.contains(filterType) && filterType == 'IsSpecial') {
        filterCondition =
          'WHERE Id IN (SELECT contactId__c FROM ContactExtraInfo__c WHERE isSpecial__c = ' +
          String.escapeSingleQuotes(filterValue) +
          ')';
      }
    }

    try {
      String query =
        'SELECT Id, FirstName, LastName, Phone, Email, CreatedDate, Account.Name, ' +
        '(SELECT isSpecial__c FROM ContactExtraInfos__r) ' +
        'FROM Contact ' +
        filterCondition +
        'ORDER BY ' +
        orderByField +
        ' ' +
        orderByOrder +
        ' ' +
        'LIMIT :pageSize ' +
        'OFFSET :offsetSize';

      List<Contact> contacts = Database.query(query);

      List<ContactResponse> contactList = mapContacts(contacts);

      return JSON.serialize(contactList);
    } catch (Exception e) {
      throw new AuraHandledException(e.getMessage());
    }
  }

  private static List<ContactResponse> mapContacts(List<Contact> contacts) {
    List<ContactResponse> contactResponseList = new List<ContactResponse>();

    if (contacts.size() > 0) {
      for (Contact contact : contacts) {
        Boolean isSpecial = contact.ContactExtraInfos__r.size() > 0
          ? contact.ContactExtraInfos__r[0].isSpecial__c
          : false;
        ContactResponse contactResponse = new ContactResponse(
          contact.FirstName + ' ' + contact.LastName,
          contact.Phone,
          contact.Email,
          contact.Account?.Name,
          String.valueOf(contact.CreatedDate),
          isSpecial
        );

        contactResponseList.add(contactResponse);
      }
    }

    return contactResponseList;
  }

  public class ContactObj {
    @AuraEnabled
    public String firstName { get; set; }
    @AuraEnabled
    public String lastName { get; set; }
    @AuraEnabled
    public String phone { get; set; }
    @AuraEnabled
    public String email { get; set; }
    @AuraEnabled
    public String accountId { get; set; }
    @AuraEnabled
    public String createdDate { get; set; }
  }

  public class ContactResponse {
    @AuraEnabled
    public String name { get; set; }
    @AuraEnabled
    public String phone { get; set; }
    @AuraEnabled
    public String email { get; set; }
    @AuraEnabled
    public String accountName { get; set; }
    @AuraEnabled
    public String createdDate { get; set; }
    @AuraEnabled
    public Boolean isSpecial { get; set; }

    public ContactResponse(
      String name,
      String phone,
      String email,
      String accountName,
      String createdDate,
      Boolean isSpecial
    ) {
      this.name = name;
      this.phone = phone;
      this.email = email;
      this.accountName = accountName;
      this.createdDate = createdDate;
      this.isSpecial = isSpecial;
    }
  }
}
