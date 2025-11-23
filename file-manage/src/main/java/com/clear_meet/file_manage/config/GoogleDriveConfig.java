package com.clear_meet.file_manage.config;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Configuration
public class GoogleDriveConfig {
    /**
     * Application name.
     */
    private static final String APPLICATION_NAME = "clear-meet";
    /**
     * Global instance of the JSON factory.
     */
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();

    /**
     * Path for Service Account credentials.
     */
    private static final String CREDENTIALS_PATH = "credentials.json";

    /**
     * Creates the Drive service using given Service Account Key.
     * @return Builds a new Drive instance.
     * @throws IOException when CREDENTIAL_PATH is invalid
     * @throws GeneralSecurityException
     */
    @Bean
    public Drive googleDriveClient() throws IOException, GeneralSecurityException {
        // Your logic goes here!
        InputStream in = new ClassPathResource("credentials.json").getInputStream();

        GoogleCredentials credentials = GoogleCredentials.fromStream(in)
                .createScoped(Collections.singleton(DriveScopes.DRIVE));
        System.out.println("Credentials found: " + credentials.toString());

        Drive drive = new Drive.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                new HttpCredentialsAdapter(credentials))
                .setApplicationName("clear-meet")
                .build();
        System.out.println("Google Drive Service is " + drive.toString());
        return drive;
    }
}
