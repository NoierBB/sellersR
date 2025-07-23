package org.example.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "http://localhost:3000")
public class DebugController {
    
    @PostMapping("/login")
    public ResponseEntity<?> debugLogin(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        System.out.println("🔍 DEBUG LOGIN - URI: " + request.getRequestURI());
        System.out.println("🔍 DEBUG LOGIN - Method: " + request.getMethod());
        System.out.println("🔍 DEBUG LOGIN - Content-Type: " + request.getContentType());
        System.out.println("🔍 DEBUG LOGIN - Body: " + body);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Debug login works",
            "uri", request.getRequestURI(),
            "method", request.getMethod(),
            "body", body
        ));
    }
    
    @GetMapping("/status")
    public ResponseEntity<?> status() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Debug controller is working",
            "timestamp", System.currentTimeMillis()
        ));
    }
} 
 
 