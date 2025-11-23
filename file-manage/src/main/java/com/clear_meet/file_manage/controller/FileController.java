package com.clear_meet.file_manage.controller;

import com.clear_meet.file_manage.service.FileManagerService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "http://localhost:3000")
public class FileController {

    private final FileManagerService fileService;

    public FileController(FileManagerService fileService) {
        this.fileService = fileService;
    }

    @PostMapping("/upload")
    public ResponseEntity<String> upload(@RequestParam("file") MultipartFile file) {
        try {
            String fileId = fileService.uploadFile(file);
            return ResponseEntity.ok("File ID: " + fileId);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }

	@DeleteMapping("/delete/{fileId}")
    public ResponseEntity<String> delete(@PathVariable String fileId) {
        try {
            fileService.deleteFile(fileId);
            return  ResponseEntity.ok("File ID: " + fileId);
        } catch (RuntimeException e) {
            return ResponseEntity.status(500).body("Delete failed: " + e.getMessage());
        }
    }

    @GetMapping("/download/{fileId}")
    public void download(@PathVariable String fileId, HttpServletResponse response) throws IOException {
        // 1. Set the response type (optional: dynamic based on file)
        response.setContentType("application/octet-stream");
        response.addHeader("Content-Disposition", "attachment; filename=\"downloaded_file\"");
        // 2. Stream directly from Drive -> Spring Boot -> User
        fileService.downloadFile(fileId, response.getOutputStream());
        response.flushBuffer();
    }
}