export interface IFieldNoteSetting {
    FieldName: string;
    FieldNote: string;
    Date: string;
}

export interface IFieldNotesSettings {
    Notes: IFieldNoteSetting[];
    IncludeDate: boolean;
}

export class SettingsFactory {

    public static GetEmptyFieldNotesSettings(): IFieldNotesSettings {
        return { Notes: [], IncludeDate: true };
    }

    public static readonly fieldNotesSettingsKey = 'DemoIncFieldNotesSettings';
}
