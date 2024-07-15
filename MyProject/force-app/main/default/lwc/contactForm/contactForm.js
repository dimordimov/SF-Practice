import { LightningElement, wire, track } from 'lwc';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';
import createContact from '@salesforce/apex/ContactController.createContact';
import CONTACT_ADDED_CHANNEL from '@salesforce/messageChannel/ContactAdded__c';
import { createMessageContext, releaseMessageContext, publish } from 'lightning/messageService';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class ContactForm extends LightningElement {
    @track form = {
        firstName: null,
        lastName: null,
        phone: null,
        email: null,
        accountId: null,
    };

    accountOptions = [];

    context = createMessageContext();

    @wire(getAccounts)
    wiredAccounts({ error, data }) {
        if (data) {
            this.accountOptions = data.map(account => {
                return { label: account.Name, value: account.Id };
            });
        } else if (error) {
            console.error('Error getting accounts', error);
        }
    }

    handleInputChange(event) {
        const field = event.target.dataset.field;
        this.form[field] = event.target.value;
    }

    handleAccountChange(event) {
        this.form.accountId = event.detail.value;
    }

    clearForm() {
        this.form = {
            firstName: null,
            lastName: null,
            phone: null,
            email: null,
            accountId: null,
        };
    }

    handleSubmit(e) {
        e.preventDefault();

        createContact({ contactData: JSON.stringify(this.form) })
            .then(() => {
                this.showNotification("Contact Created", "You've successfully added a new contact!", "success");
            })
            .then(() => {
                publish(this.context, CONTACT_ADDED_CHANNEL, {
                    contactCreated: true
                });
            })
            .then(() => {
                this.clearForm();
            })
            .catch(error => {
                this.showNotification("Failed to create Contact", "Something went wrong!", "error");
                console.error('Error creating contact', error);
            });
    }

    showNotification(title, message, variant) {
        const evt = new ShowToastEvent({
          title: title,
          message: message,
          variant: variant,
        });
        this.dispatchEvent(evt);
    }

    disconnectedCallback() {
        releaseMessageContext(this.context);
    }
}