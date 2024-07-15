import { LightningElement, wire, track } from 'lwc';
import getContacts from '@salesforce/apex/ContactController.getContacts';
import getContactsCount from '@salesforce/apex/ContactController.getContactsCount';
import { subscribe, MessageContext } from 'lightning/messageService';
import CONTACT_ADDED_CHANNEL from '@salesforce/messageChannel/ContactAdded__c';
import { refreshApex } from '@salesforce/apex';

const COLUMNS = [
    { label: 'Name', fieldName: 'name' },
    { label: 'Phone', fieldName: 'phone', type: 'phone' },
    { label: 'Email', fieldName: 'email', type: 'email' },
    { label: 'Created Date', fieldName: 'createdDate', type: 'date-time' },
    { label: 'Account Name', fieldName: 'accountName' },
    { label: 'Is Special', fieldName: 'isSpecial', type: 'boolean' }
];

export default class ContactTable extends LightningElement {
    columns = COLUMNS;
    contacts;
    wiredContactsResult;
    wiredContactCountResult;
    
    pageNumber = 1;
    pageSize = 3;
    totalRecords;
    totalPages;
    @track pages = [];

    currentPageButton;
    firstPageDisabled;
    lastPageDisabled;

    sortField = '';
    sortOrder = 'ASC';
    sortFieldDisplay = '';
    sortOptions = [
        { label: 'Name ASC', value: 'Name ASC' },
        { label: 'Name DESC', value: 'Name DESC' },
        { label: 'Phone ASC', value: 'Phone ASC' },
        { label: 'Phone DESC', value: 'Phone DESC' },
        { label: 'Email ASC', value: 'Email ASC' },
        { label: 'Email DESC', value: 'Email DESC' },
        { label: 'Created Date ASC', value: 'CreatedDate ASC' },
        { label: 'Created Date DESC', value: 'CreatedDate DESC' },
        { label: 'Account Name ASC', value: 'Account.Name ASC' },
        { label: 'Account Name DESC', value: 'Account.Name DESC' },
    ];

    filterType = '';
    filterValue = '';
    filterOptions = [
        { label: 'Name', value: 'Name' },
        { label: 'Phone', value: 'Phone' },
        { label: 'Email', value: 'Email' },
        { label: 'Account Name', value: 'Account.Name' },
        { label: 'Is Special', value: 'IsSpecial' }
    ];

    specialFilterOptions = [
        { label: 'Yes', value: 'True' },
        { label: 'No', value: 'False' }
      ];
    
    get showFilterOptions() {
        return this.filterType !== '';
    }   

    get isSpecialFilter() {
        return this.filterType === 'IsSpecial';
    } 

    @wire(getContacts, { pageNumber: '$pageNumber', pageSize: '$pageSize', sortField: '$sortField', sortOrder: '$sortOrder', filterType: '$filterType', filterValue: '$filterValue' })
    wiredContacts(result) {
        this.wiredContactsResult = result;
        const { error, data } = result;

        if (data) {
            this.contacts = JSON.parse(data);

            if (this.pageNumber === 1) {
                this.firstPageDisabled = this.pageNumber === 1;
                this.currentPageButton = this.template.querySelector('lightning-button[data-id="1"]');
                if (this.currentPageButton) this.currentPageButton.disabled = true;
            }

            this.lastPageDisabled = this.pageNumber >= this.totalPages;
        } else if (error) {
            console.error(error.message);
        }
    }

    @wire(getContactsCount, { filterType: '$filterType', filterValue: '$filterValue' })
    wiredContactsCount(result) {
        this.wiredContactCountResult = result;
        const { error, data } = result;

        if (data >= 0) {
            this.totalRecords = data;
            const pages = Math.ceil(this.totalRecords / this.pageSize);

            if (pages > 1) {
                this.totalPages = pages;
                this.pages = [];
                for (let i = 0; i < this.totalPages; i++) {
                    this.pages.push(i + 1);
                }
            } else {
                this.totalPages = 0;
                this.pages = [];
            }

            if (!this.totalPages || this.pageNumber > this.totalPages) {
                this.pageNumber = 1;
            }

        } else if (error) {
            console.error(error);
        }
    }
    
    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    subscribeToMessageChannel() {
        this.subscription = subscribe(
          this.messageContext,
          CONTACT_ADDED_CHANNEL,
          (message) => this.handleMessage(message)
        );
    }

    handleMessage(message) {
        if (message.contactCreated) {
            this.refreshContacts();
        }
    }

    refreshContacts() {
        refreshApex(this.wiredContactsResult);
        refreshApex(this.wiredContactCountResult);
    }

    handlePrevious() {
        if (this.pageNumber > 1) {
            this.pageNumber -= 1;
            this.updateButtonStatus();
        }
    }

    handleNext() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber += 1;
            this.updateButtonStatus();
        }
    }

    updateButtonStatus() {
        const currentButton = this.template.querySelector(`lightning-button[data-id="${this.pageNumber}"]`);
        if (currentButton) {
            currentButton.disabled = true;
            if (this.currentPageButton) this.currentPageButton.disabled = false;
            this.currentPageButton = currentButton;
            this.firstPageDisabled = this.pageNumber === 1;
        }
    }

    handlePageChange(event) {
        if (this.currentPageButton) this.currentPageButton.disabled = false;
        this.pageNumber = +event.target.dataset.id;
        event.target.disabled = true;
        this.currentPageButton = event.target;
        this.firstPageDisabled = this.pageNumber === 1;
    }

    handleSortFieldChange(event) {
        this.sortFieldDisplay = event.target.value;
        const [field, order] = this.sortFieldDisplay.split(' ');
        this.sortField = field;
        this.sortOrder = order;
    }

    handleFilterTypeChange(event) {
        this.filterType = event.target.value;
        this.filterValue = '';
    }

    handleFilterValueChange(event) {
        this.filterValue = event.target.value;
    }
}
