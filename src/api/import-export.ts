import { useNavigate } from "@solidjs/router";
import { dialog } from "@tauri-apps/api";
import createImportConfigDialog, {
    ImportConfigDialogSubmission,
} from "@/components/ImportConfigDialog";
import {
    duplicatesExistInFile,
    exportOnetabDataToPath,
    importFromFile,
    saveDataToPath,
} from "./actions";

type ImportExportFunctionsProps = {
    promptUser: ReturnType<typeof createImportConfigDialog>["promptUser"];
};

export function createImportExportFunctions({
    promptUser,
}: ImportExportFunctionsProps) {
    const navigate = useNavigate();

    async function importData() {
        try {
            const importFilePath = await dialog.open({
                title: "Import Data From File",
            });

            if (importFilePath && !Array.isArray(importFilePath)) {
                if (await duplicatesExistInFile(importFilePath)) {
                    const config = await promptUser();

                    if (config) {
                        importData(importFilePath, config);
                    }
                } else {
                    importData(importFilePath);
                }
            }
        } catch (e) {
            dialog.message(e as string, {
                title: "Error",
                type: "error",
            });
        }

        async function importData(
            path: string,
            config: ImportConfigDialogSubmission = {
                strategy: "KeepAll",
                position: "Before",
            },
        ) {
            const dupesExist = await importFromFile(path, config);

            if (dupesExist) {
                const res = await dialog.ask(
                    "Dupes were found in the provided file. Would you like to resolve them?",
                    "Duplicate Data Detected",
                );

                if (res) {
                    navigate("/resolve-dupes");
                }
            }
        }
    }

    async function saveData() {
        const path = await dialog.save({
            title: "Pick a save location",
        });

        if (!path) {
            return;
        }

        await saveDataToPath(path);

        dialog.message("Save successful", {
            title: "Success",
            type: "info",
        });
    }

    async function exportForOnetab() {
        const path = await dialog.save({
            title: "Pick an export location",
        });

        if (!path) {
            return;
        }

        await exportOnetabDataToPath(path);

        dialog.message("Export successful", {
            title: "Success",
            type: "info",
        });
    }

    return {
        importData,
        saveData,
        exportForOnetab,
    };
}
