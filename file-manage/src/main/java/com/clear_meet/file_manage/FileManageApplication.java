package com.clear_meet.file_manage;

import com.clear_meet.file_manage.service.GoogleDriveService;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
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
			testLifeCycle(myService);
		};
	}

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
	}

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
}

