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

    @GetMapping("/download/{id}")
    public void download(@PathVariable String id, HttpServletResponse response) throws IOException {
        // Stream directly to the response output (no internal buffer)
        response.addHeader("Content-Disposition", "attachment; filename=\"downloaded_file\"");
        fileService.downloadFile(id, response.getOutputStream());
    }
}