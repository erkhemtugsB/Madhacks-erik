package com.clear_meet.file_manage.service;

import jakarta.servlet.ServletOutputStream;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class FileManagerService {
    public void downloadFile(String id, ServletOutputStream outputStream) {
    }

    public String uploadFile(MultipartFile file) throws IOException {
        return null;
    }

    public void replaceFile(String fileId) throws IOException {
    }
}
