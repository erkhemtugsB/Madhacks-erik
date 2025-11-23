package com.clear_meet.file_manage.service;

import com.google.api.client.http.InputStreamContent;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;
import com.google.api.services.drive.model.Permission;
import com.google.api.services.drive.model.PermissionList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/* class to interact with Google Drive API */
@Component
public class GoogleDriveService {
    @Autowired
    private Drive driveClient;

    @Value("${google.drive.folder-id}")
    private String folderId;

    public String uploadFile(MultipartFile file) throws IOException {
        File fileMetaData = createFileMeta(file);
        File uploadFile = driveClient
                .files()
                .create(fileMetaData, new InputStreamContent(
                        file.getContentType(),
                        new ByteArrayInputStream(file.getBytes()))
                )
                .setSupportsAllDrives(true)
                .setFields("id").execute();
        System.out.println("Successfully uploaded: " + uploadFile);
        return uploadFile.getId();
    }

    private File createFileMeta(MultipartFile file) {
        if (file == null) {
            throw new IllegalArgumentException("File is null");
        }
        File fileMetaData = new File();
        String fileOriginalName = file.getOriginalFilename();
        if (fileOriginalName != null) {
            fileMetaData.setParents(Collections.singletonList(folderId));
        }
        fileMetaData.setName(fileOriginalName);
        return fileMetaData;
    }

    public String deleteAllFiles() throws IOException {
        List<File> fileList = driveClient.files().list()
                // REQUIRED for Shared Drives:
                .setSupportsAllDrives(true)
                .setIncludeItemsFromAllDrives(true)
                .execute().getFiles();
        String query = "'" + folderId + "' in parents and trashed = false";
        // Step 1: Get the list of files matches your query
        FileList result = driveClient.files().list()
                .setQ(query)
                // CRITICAL ADDITION: Explicitly request the fields you need
                .setFields("files(id, name, capabilities/canTrash)")
                // REQUIRED for Shared Drives:
                .setSupportsAllDrives(true)
                .setIncludeItemsFromAllDrives(true)
                .execute();

        List<File> filesToDelete = result.getFiles();
        System.out.println("Deleting files: " + filesToDelete.toString());

        // Step 2: Delete them individually
        if (filesToDelete == null) {
            return "Delete all files failed.";
        }
        for (File f : filesToDelete) {
            // Check capabilities before trying to delete
            if (f.getCapabilities() != null && Boolean.FALSE.equals(f.getCapabilities().getCanTrash())) {
                System.out.println("SKIP: I am not allowed to delete " + f.getName());
                continue;
            }
            String fileId = f.getId();
            try {
                driveClient.files().delete(fileId)
                        .setSupportsAllDrives(true)
                        .execute();
                //System.out.println("Deleted: " + f.getName());

            } catch (com.google.api.client.googleapis.json.GoogleJsonResponseException e) {
                if (e.getStatusCode() == 404) {
                    System.out.println("SKIP: File " + f.getName() + " was already deleted (404).");
                } else {
                    // If it's a different error (like 403), we want to know about it
                    System.err.println("Error deleting " + f.getName() + ": " + e.getMessage());
                }
            }
        }
        return "Successfully deleted all files";
    }

    public List<File> listFiles() throws IOException {
        ArrayList<File> allFiles = new ArrayList<>();
        String query = "'" + folderId + "' in parents and trashed = false";
        String pageToken = null;
        do {
            FileList result = driveClient.files().list()
                    .setQ(query)                        // <--- The Filter
                    .setPageSize(100)                   // Fetch 100 at a time
                    .setFields("nextPageToken, files(id, name, webViewLink)")
                    .setPageToken(pageToken)    // Pagination logic

                    // REQUIRED for Shared Drives:
                    .setSupportsAllDrives(true)
                    .setIncludeItemsFromAllDrives(true)

                    .execute();

            allFiles.addAll(result.getFiles());
            pageToken = result.getNextPageToken();      // Move to next page
        } while (pageToken != null);
        return allFiles;
    }

    public List<Permission> getFolderMembers() throws IOException {
        // Request the permissions list for the specific Folder ID
        PermissionList result = driveClient.permissions().list(folderId)
                // We specifically ask for email, role, and name
                .setFields("permissions(id, type, emailAddress, role, displayName)")
                .setSupportsAllDrives(true)
                .execute();

        return result.getPermissions();
    }
}
