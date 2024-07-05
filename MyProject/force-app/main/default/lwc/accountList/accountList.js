import { LightningElement, wire, track } from "lwc";
import NAME_FIELD from "@salesforce/schema/Account.Name";
import PHONE_FIELD from "@salesforce/schema/Account.Phone"
import ANNUALREVENUE_FIELD from "@salesforce/schema/Account.AnnualRevenue"

import { refreshApex } from '@salesforce/apex';

import getAccounts from "@salesforce/apex/AccountController.getAccounts";
import deleteAccount from "@salesforce/apex/AccountController.deleteAccount";

const COLUMNS = [
  { label: "Account Name", fieldName: NAME_FIELD.fieldApiName, type: "text" },
  {
    label: "Phone",
    fieldName: PHONE_FIELD.fieldApiName,
    type: "phone"
  },
  {
    label: "AnnualRevenue",
    fieldName: ANNUALREVENUE_FIELD.fieldApiName,
    type: "currency"
  },
  {
    label: 'Edit',
    type: 'button',
    typeAttributes: {
      label: 'Edit',
      name: 'edit',
      variant: 'brand'
    }
  },
  {
    label: 'Delete',
    type: 'button',
    typeAttributes: {
      label: 'Delete',
      name: 'delete',
      variant: 'destructive'
    }
  }
];

export default class AccountList extends LightningElement {
  columns = COLUMNS;
  @track accounts;
  @track showForm = false;
  wiredAccountsResult;

  @wire(getAccounts)
  wiredAccounts(result) {
    this.wiredAccountsResult = result;
    const { data, error } = result;
    if (data) {
      this.accounts = data;
    } else if (error) {
      this.accounts = undefined;
      console.error(error);
    }
  }

  handleShowForm() {
    this.showForm = true;
  }

  handleHideForm() {
    this.showForm = false;
  }

  handleAction(event) {
    const actionName = event.detail.action.name;
    const row = event.detail.row;
    switch (actionName) {
      case 'edit':
        this.editAccount(row);
        break;
      case 'delete':
        this.handleDeleteAccount(row);
        break;
      default:
    }
  }

  editAccount() {
    console.log("Edit account");
  }

  handleDeleteAccount(row) {
    const accountId = row.Id;

    deleteAccount({ accountId })
      .then(() => refreshApex(this.wiredAccountsResult)
      )
      .catch(error => {
        console.error('Error deleting account:', error);
      });
  }

  handleCreateSuccess() {
    this.showForm = false;
    refreshApex(this.wiredAccountsResult);
  }

  handleCreateError(event) {
    console.error('Error creating account:', event.detail);
  }
}
