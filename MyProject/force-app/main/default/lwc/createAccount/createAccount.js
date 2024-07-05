import { LightningElement, track, api } from 'lwc';
import createAccount from '@salesforce/apex/AccountController.createAccount';

export default class CreateAccount extends LightningElement {
    @api showForm = false;
    @track accountName = '';
    @track phone = '';
    @track annualRevenue = '';

    handleNameChange(event) {
        this.accountName = event.target.value;
    }

    handlePhoneChange(event) {
        this.phone = event.target.value;
    }

    handleRevenueChange(event) {
        this.annualRevenue = event.target.value;
    }

    handleSave() {
        const accountData = {
            name: this.accountName,
            phone: this.phone,
            annualRevenue: this.annualRevenue
        };

        createAccount({ accountObj: JSON.stringify(accountData) })
            .then(() => {
                this.dispatchEvent(new CustomEvent('success'));
                this.clearForm();
            })
            .catch(error => {
                this.dispatchEvent(new CustomEvent('error', { detail: error }));
                this.clearForm();
            });
    }

    handleCancel() {
        this.clearForm();
    }

    clearForm() {
        this.accountName = '';
        this.phone = '';
        this.annualRevenue = '';
        this.dispatchEvent(new CustomEvent('hide'));
    }
}