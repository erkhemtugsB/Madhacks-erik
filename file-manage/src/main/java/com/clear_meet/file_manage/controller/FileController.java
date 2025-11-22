package com.clear_meet.file_manage.controller;

import com.clear_meet.file_manage.service.FileManagerService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private FileManagerService fileService;

    @PostMapping("/upload")
    public ResponseEntity<String> upload(@RequestParam("file") MultipartFile file) {
        try {
            String fileId = fileService.uploadFile(file);
            return ResponseEntity.ok("File ID: " + fileId);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }

	@PutMapping("/put/{fileId}")
    public ResponseEntity<String> put(@PathVariable String fileId, @RequestParam("file") MultipartFile file) {
        try {
            fileService.replaceFile(fileId);
            return ResponseEntity.ok("File ID: " + fileId);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Replace failed: " + e.getMessage());
        }

    }

    @GetMapping("/download/{fileId}")
    public void download(@PathVariable String fileId, HttpServletResponse response) throws IOException {
        // Stream directly to the response output (no internal buffer)
        response.addHeader("Content-Disposition", "attachment; filename=\"downloaded_file\"");
        fileService.downloadFile(fileId, response.getOutputStream());
    }
}