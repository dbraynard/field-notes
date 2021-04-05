import { IFieldNotesSettings, SettingsFactory } from '../DemoInc/FieldNotesShared'

(async ($) => {

    class Id {
        public static CancelButton: string = '#cancelButton';
        public static OkButton: string = '#okButton';
        public static IncludeDateCb: string = '#includeDateCb';
    }

    class E {
        public static Click: string = 'click';
        public static Checked: string = 'checked';
    }

    class FieldNotesDialog {

        private settings: IFieldNotesSettings;

        constructor() { }

        public async initialize() {

            await tableau.extensions.initializeDialogAsync();

            //initialize the ui
            $(Id.OkButton).on(E.Click, this.okButtonClicked.bind(this))
            $(Id.CancelButton).on(E.Click, this.cancelButtonClicked.bind(this))
            this.updateUI();
        }

        private updateUI() {
            var json = tableau.extensions.settings.get(SettingsFactory.fieldNotesSettingsKey);
            this.settings = json ? <IFieldNotesSettings>JSON.parse(json) : SettingsFactory.GetEmptyFieldNotesSettings();
            $(Id.IncludeDateCb).prop(E.Checked, this.settings.IncludeDate);
        }

        private async okButtonClicked() {

            //update the settings            
            var checked = $(Id.IncludeDateCb).is(`:${E.Checked}`);
            this.settings.IncludeDate = checked;
            var updatedJson = JSON.stringify(this.settings);
            tableau.extensions.settings.set(SettingsFactory.fieldNotesSettingsKey, updatedJson);
            await tableau.extensions.settings.saveAsync();

            tableau.extensions.ui.closeDialog();
        }

        private cancelButtonClicked() {
            tableau.extensions.ui.closeDialog();
        }
    }

    console.log('Initializing FieldNotesDialog.')
    await new FieldNotesDialog().initialize();

})(jQuery);