public with sharing class ContactTriggerHandler {
    public static void createContactExtraInfo(List<Contact> newContacts) {
        List<ContactExtraInfo__c> contactExtraInfoList = new List<ContactExtraInfo__c>();

        for (Contact contact : newContacts) {
            ContactExtraInfo__c extraInfo = new ContactExtraInfo__c();
            extraInfo.contactId__c = contact.Id;
            extraInfo.contactSpecialName__c = contact.FirstName + ' ' + contact.LastName + ' ' + Date.today();
            extraInfo.isSpecial__c = Date.today().month() == 2;
            contactExtraInfoList.add(extraInfo);
        }

        if (contactExtraInfoList.size() > 0) {
            insert contactExtraInfoList;
        }
    }
}
