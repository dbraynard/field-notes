import { DataSource, DataTable, MarksCollection, MarksSelectedEvent, SettingsChangedEvent, TableauEvent } from '@tableau/extensions-api-types';
import * as sanitizeHtml from 'sanitize-html';
import { IFieldNotesSettings, IFieldNoteSetting, SettingsFactory } from '../DemoInc/FieldNotesShared';


//TODO: change var to const where possible.

(async ($) => {

    class Id {
        public static fieldNotesTable: string = '#fieldNotesTable';
        public static loadingTable: string = '#loadingTable';
        public static noFieldNotesTable: string = '#noFieldNotesTable';
        public static fieldList: string = '#fieldList';
        public static fieldNote: string = '#fieldNote';
        public static addNote: string = '#addNote';
        public static dateHeader: string = '#dateHeader';
        public static fieldNotesDialog: string = 'FieldNotesDialog.html';
        public static parentDirectory: string = 'DemoInc';

    }

    class Css {
        public static Hidden: string = 'hidden';
        public static Show: string = 'show';
    }

    //TODO: refactor this class
    class E {
        public static Click: string = 'click';
    }

    class FieldNotes {

        constructor() { }

        public async initialize() {

            await tableau.extensions.initializeAsync({ 'configure': this.configure })

            // This event fires when when settings.saveAsync is called by the parent or popup dialog.
            tableau.extensions.settings.addEventListener(tableau.TableauEventType.SettingsChanged,
                this.tableauSettingsChanged.bind(this));

            $(Id.addNote).on(E.Click, this.addNote.bind(this));

            this.displayFieldNotesLoading();
            await this.populateFieldList();
            await this.populateNotesTableFromSettings();

        }

        private delayForTesting(ms: number) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        private async addNote() {

            var fieldName = <string>$(Id.fieldList).val();
            var fieldNote = <string>$(Id.fieldNote).val();
            var currentDate = new Date().toLocaleString();

            //prevent xss attacks
            fieldName = sanitizeHtml(fieldName);
            fieldNote = sanitizeHtml(fieldNote);

            //Saving the new note to settings will trigger the settings changed handler
            //which will update the ui.
            var json = tableau.extensions.settings.get(SettingsFactory.fieldNotesSettingsKey);
            var settings = json ? <IFieldNotesSettings>JSON.parse(json) : SettingsFactory.GetEmptyFieldNotesSettings();

            var newNote = <IFieldNoteSetting>{
                FieldName: fieldName,
                FieldNote: fieldNote,
                Date: currentDate
            };

            settings.Notes.push(newNote);
            var settingsJson = JSON.stringify(settings);
            tableau.extensions.settings.set(SettingsFactory.fieldNotesSettingsKey, settingsJson);

            //save
            await tableau.extensions.settings.saveAsync();

        }

        private async tableauSettingsChanged(event: SettingsChangedEvent) {

            this.displayFieldNotesLoading();
            var settings = event.newSettings;
            var json = settings[SettingsFactory.fieldNotesSettingsKey];
            if (json) {
                this.populateNotesTableFromString(json);
            }
            else {
                this.displayNoFieldNotes();
            }
        }

        private async populateNotesTableFromSettings() {

            var json = tableau.extensions.settings.get(SettingsFactory.fieldNotesSettingsKey)
            if (json) {
                this.populateNotesTableFromString(json);
            }
            else {
                //no settings
                this.displayNoFieldNotes();
            }
        }

        private async populateNotesTableFromString(json: string) {

            var settings = <IFieldNotesSettings>JSON.parse(json);
            this.clearTable();
            const notesTable = this.getNotesTable();
            settings.Notes.forEach(n => {
                this.addNoteToTableUI(n, settings.IncludeDate, notesTable);
            });

            if (settings.Notes.length > 0) {
                this.displayFieldNotes();
            }
            else {
                this.displayNoFieldNotes();
            }

            if (settings.IncludeDate) {
                this.ShowDateColumn();
            }
            else {
                this.HideDateColumn();
            }

        }

        private HideDateColumn() {
            $(Id.dateHeader).removeClass(Css.Show).addClass(Css.Hidden);
        }

        private ShowDateColumn() {
            $(Id.dateHeader).removeClass(Css.Hidden).addClass(Css.Show);
        }

        private getNotesTable(): HTMLTableElement {
            return <HTMLTableElement>$(`${Id.fieldNotesTable} > tbody`)[0];
        }

        private async clearTable() {
            $(`${Id.fieldNotesTable} > tbody tr`).remove();
        }

        private addNoteToTableUI(noteSetting: IFieldNoteSetting,
            showDate: boolean,
            table: HTMLTableElement) {

            const rowCount = table.rows.length;
            const newRow = table.insertRow(rowCount);
            let cell = 0;

            //field name
            const fieldNameCell = newRow.insertCell(cell++);
            fieldNameCell.innerHTML = sanitizeHtml(noteSetting.FieldName);

            //field notes            
            const notesCell = newRow.insertCell(cell++);
            notesCell.innerHTML = sanitizeHtml(noteSetting.FieldNote);

            //date (if provided)
            if (showDate) {
                const dateCell = newRow.insertCell(cell++);

                dateCell.innerHTML = sanitizeHtml(noteSetting.Date);
            }

            //delete button
            const deleteButtonCell = newRow.insertCell(cell++);
            const deleteButton = document.createElement('button');
            deleteButtonCell.append(deleteButton);
            deleteButton.innerHTML = 'Delete';
            deleteButton.type = 'button';
            deleteButton.className = 'btn dialogButton';
            deleteButton.addEventListener('click', this.deleteFieldNote.bind(this, rowCount));

            //clear notes field
            $(Id.fieldNote).val('');
        }

        private async deleteFieldNote(fieldNoteRow: number) {

            //delete the thing
            console.log(`delete fieldName:${fieldNoteRow}`);
            //remove this from the settings
            var json = tableau.extensions.settings.get(SettingsFactory.fieldNotesSettingsKey);
            if (!json) {
                return;
            }
            var settings = <IFieldNotesSettings>JSON.parse(json);
            if (fieldNoteRow > -1) {
                settings.Notes.splice(fieldNoteRow, 1);
            }
            var settingsJson = JSON.stringify(settings);
            tableau.extensions.settings.set(SettingsFactory.fieldNotesSettingsKey, settingsJson);

            //save
            await tableau.extensions.settings.saveAsync();

        }


        private async populateFieldList() {

            await this.delayForTesting(2500);

            const dataSourceFetchPromises: Array<Promise<DataSource[]>> = [];
            const dashboard = tableau.extensions.dashboardContent.dashboard;
            dashboard.worksheets.forEach(ws => dataSourceFetchPromises.push(ws.getDataSourcesAsync()))
            const fetchResults = await Promise.all(dataSourceFetchPromises);

            const dataSourcesUnique: { [key: string]: any } = {};
            const dashboardDataSources: DataSource[] = [];

            fetchResults.forEach(dss => {
                dss.forEach(ds => {
                    if (!dataSourcesUnique[ds.id]) {
                        dataSourcesUnique[ds.id] = true;
                        dashboardDataSources.push(ds);
                    }
                });
            });

            var allFields = dashboardDataSources.flatMap(s => s.fields.map(f => f.name));
            allFields.sort();
            allFields.forEach(field => {
                $(Id.fieldList).append(`<option>${field}</option>`);
            })
        }

        private async displayFieldNotesLoading() {
            $(Id.loadingTable)
                .removeClass(Css.Hidden)
                .addClass(Css.Show);
            $(Id.fieldNotesTable)
                .removeClass(Css.Show)
                .addClass(Css.Hidden);
            $(Id.noFieldNotesTable)
                .removeClass(Css.Show)
                .addClass(Css.Hidden);
        }

        private async displayNoFieldNotes() {
            $(Id.loadingTable)
                .removeClass(Css.Show)
                .addClass(Css.Hidden);
            $(Id.fieldNotesTable)
                .removeClass(Css.Show)
                .addClass(Css.Hidden);
            $(Id.noFieldNotesTable)
                .removeClass(Css.Hidden)
                .addClass(Css.Show);
        }

        private async displayFieldNotes() {
            $(Id.loadingTable)
                .removeClass(Css.Show)
                .addClass(Css.Hidden);
            $(Id.fieldNotesTable)
                .removeClass(Css.Hidden)
                .addClass(Css.Show);
            $(Id.noFieldNotesTable)
                .removeClass(Css.Show)
                .addClass(Css.Hidden);
        }

        public async configure(): Promise<object> {

            const popupUrl = `${window.location.origin}/${Id.parentDirectory}/${Id.fieldNotesDialog}`;
            var inputPayload = ''
            try {
                //display popup dialog
                await tableau.extensions.ui
                    .displayDialogAsync(popupUrl,
                        inputPayload,
                        { width: 329, height: 200 });
            }
            catch (e) {
                if (e instanceof Error) {
                    console.log('Custom error', e.name, e.message);
                }
            }
            return
        }
    }

    console.log('Initializing FieldNotes extension.')
    await new FieldNotes().initialize();
}

)(jQuery);