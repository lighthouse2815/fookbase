package com.dang.app.utils.clouddinary;

import com.cloudinary.Cloudinary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ImageService {

    private final Cloudinary cloudinary;

    public String uploadImage(MultipartFile file) throws IOException {

        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                Map.of(
                        "folder", "chat_images",
                        "resource_type", "image"
                )
        );

        return result.get("secure_url").toString();
    }
}

