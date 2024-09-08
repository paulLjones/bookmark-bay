import { Portal } from "solid-js/web";
import { purge } from "@/api/actions";
import { createImportExportFunctions } from "@/api/import-export";
import Button from "@/components/Button";
import createImportConfigDialog from "@/components/ImportConfigDialog";

export default function Header() {
    const { ImportConfigDialog, promptUser } = createImportConfigDialog();

    const { importData, saveData, exportForOnetab } =
        createImportExportFunctions({
            promptUser,
        });

    return (
        <>
            <header class="flex w-full justify-between bg-gray-950 p-5">
                <div class="ms-auto flex justify-end gap-5">
                    <Button onClick={purge} color="darkYellow" rounded>
                        Purge Memory
                    </Button>

                    <Button onClick={importData} color="darkBlue" rounded>
                        Import
                    </Button>

                    <Button onClick={saveData} color="darkGreen" rounded>
                        Save
                    </Button>

                    <Button onClick={exportForOnetab} color="darkRed" rounded>
                        Export For Onetab
                    </Button>
                </div>
            </header>

            <Portal mount={document.body}>
                <ImportConfigDialog />
            </Portal>
        </>
    );
}
