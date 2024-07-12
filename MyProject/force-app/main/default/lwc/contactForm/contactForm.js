import { LightningElement, wire, track } from 'lwc';
import getAccounts from '@salesforce/apex/AccountController.getAccounts';
import createContact from '@salesforce/apex/ContactController.createContact';

export default class ContactForm extends LightningElement {
    @track form = {
        firstName: null,
        lastName: null,
        phone: null,
        email: null,
        accountId: null,
    };

    accountOptions = [];

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
                this.clearForm();
            })
            .catch(error => {
                console.error('Error creating contact', error);
            });
    }
}