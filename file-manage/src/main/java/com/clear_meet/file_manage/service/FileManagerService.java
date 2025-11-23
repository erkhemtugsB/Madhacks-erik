package com.clear_meet.file_manage.service;

import jakarta.servlet.ServletOutputStream;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface FileManagerService {
    public void downloadFile(String id, ServletOutputStream outputStream) throws IOException;

    public String uploadFile(MultipartFile file) throws IOException;

    //public void replaceFile(String fileId) throws IOException;

    public void deleteFile(String fileId) throws RuntimeException;
}
