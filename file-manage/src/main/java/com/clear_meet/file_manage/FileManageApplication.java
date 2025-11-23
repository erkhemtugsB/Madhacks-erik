package com.clear_meet.file_manage;

import com.clear_meet.file_manage.service.GoogleDriveService;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StreamUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;

@SpringBootApplication
public class FileManageApplication {

	public static void main(String[] args) {
		SpringApplication.run(FileManageApplication.class, args);

	}

	// This creates a "runner" that Spring executes immediately after startup
	@Bean
	public CommandLineRunner testMyService(GoogleDriveService myService) {
		return args -> {
			testControllerCycle();
		};
	}

	public void testControllerCycle() {
		RestTemplate restTemplate = new RestTemplate();
		String baseUrl = "http://localhost:8080/api/files";

		System.out.println("--- STARTING API TEST ---");

		// ==========================================
		// 1. TEST UPLOAD
		// ==========================================
		System.out.println("1. Testing Upload...");

		// Create a dummy file in memory
		String fileContent = "This is a test content from CommandLineRunner.";
		ByteArrayResource resource = new ByteArrayResource(fileContent.getBytes()) {
			@Override
			public String getFilename() {
				// Required: MultipartFile needs a filename to work!
				return "runner_test.txt";
			}
		};

		// Build HTTP Request
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.MULTIPART_FORM_DATA);

		MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
		body.add("file", resource);

		HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

		// Execute Post
		ResponseEntity<String> response = restTemplate.postForEntity(
				baseUrl + "/upload",
				requestEntity,
				String.class
		);

		// Parse File ID
		String responseBody = response.getBody();
		String fileId = responseBody.replace("File ID: ", "");
		System.out.println("   [SUCCESS] Uploaded. Got ID: " + fileId);


		// ==========================================
		// 2. TEST DOWNLOAD
		// ==========================================
		System.out.println("2. Testing Download...");

		java.io.File downloadDest = new java.io.File("downloaded_runner_test.txt");

		// We use 'execute' to handle the stream response directly
		restTemplate.execute(
				baseUrl + "/download/" + fileId,
				HttpMethod.GET,
				null,
				clientResponse -> {
					StreamUtils.copy(clientResponse.getBody(), new FileOutputStream(downloadDest));
					return downloadDest;
				}
		);

		System.out.println("   [SUCCESS] File downloaded to: " + downloadDest.getAbsolutePath());


		// ==========================================
		// 3. TEST DELETE
		// ==========================================
		System.out.println("3. Testing Delete...");

		restTemplate.delete(baseUrl + "/delete/" + fileId);

		System.out.println("   [SUCCESS] File deleted.");
		System.out.println("--- TEST COMPLETED ---");
	};
/*
	public void testLifeCycle(GoogleDriveService driveService) throws IOException, InterruptedException {
		System.out.println("--- STARTING UPLOAD & DELETE TEST ---");
		// 1. Create your test content
		String textContent = "Hello! This is a test file created at " + System.currentTimeMillis();

		// 2. Wrap it in our custom "Mock" MultipartFile (defined below)
		MultipartFile testFile = new InMemoryMultipartFile(
				"test_upload.txt",     // The filename
				textContent.getBytes() // The content as bytes
		);

		// 3. Call your service method
		String uploadedFileId = driveService.uploadFile(testFile);

		System.out.println("SUCCESS: Uploaded file. ID: " + uploadedFileId);
/*
		// Optional: Pause for 3 seconds so you can visually verify it appeared in the folder
		System.out.println("Waiting 3 seconds before deleting...");
		Thread.sleep(3000);

		// ==========================================
		// STEP 3: Delete (Trash)
		// ==========================================
		// Since the Service Account created this file, it IS the owner.
		// Therefore, we CAN trash it successfully.
		System.out.println("Files in drive after upload: " + driveService.listFiles());
		driveService.deleteAllFiles();
		System.out.println("Files in drive after delete all: " + driveService.listFiles());

		System.out.println("SUCCESS: File moved to trash.");
		System.out.println("--- TEST FINISHED ---");*/
/*	}

	// A simple helper class to mimic a file upload in memory
	public static class InMemoryMultipartFile implements MultipartFile {

		private final String name;
		private final byte[] content;

		public InMemoryMultipartFile(String name, byte[] content) {
			this.name = name;
			this.content = content;
		}

		@Override
		public String getName() { return "file"; }

		@Override
		public String getOriginalFilename() { return this.name; }

		@Override
		public String getContentType() { return "text/plain"; }

		@Override
		public boolean isEmpty() { return content == null || content.length == 0; }

		@Override
		public long getSize() { return content.length; }

		@Override
		public byte[] getBytes() throws IOException { return content; }

		@Override
		public InputStream getInputStream() throws IOException {
			return new ByteArrayInputStream(content);
		}

		// We can leave these unimplemented for this specific test
		@Override public void transferTo(java.io.File dest) throws IOException, IllegalStateException {}
	}
	*/
}

