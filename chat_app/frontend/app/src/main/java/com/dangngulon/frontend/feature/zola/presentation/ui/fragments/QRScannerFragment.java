package com.dangngulon.frontend.feature.zola.presentation.ui.fragments;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.navigation.fragment.NavHostFragment;

import com.dangngulon.frontend.R;
import com.dangngulon.frontend.databinding.FragmentQrScannerBinding;
import com.journeyapps.barcodescanner.BarcodeCallback;
import com.journeyapps.barcodescanner.BarcodeResult;
import com.journeyapps.barcodescanner.CompoundBarcodeView;

import java.util.List;

import dagger.hilt.android.AndroidEntryPoint;

@AndroidEntryPoint
public class QRScannerFragment extends Fragment implements BarcodeCallback {
    private FragmentQrScannerBinding binding;
    private CompoundBarcodeView barcodeView;
    private boolean isTorchOn = false;
    private boolean isScanHandled = false;

    @Nullable
    @Override
    public View onCreateView(
            @NonNull LayoutInflater inflater,
            @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState
    ) {
        binding = FragmentQrScannerBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        setupBarcodeView();
        setupClickListeners();
        checkCameraPermission();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED) {
            startScanning();
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        stopScanning();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    private void setupBarcodeView() {
        barcodeView = binding.barcodeScanner;
        barcodeView.decodeContinuous(this);
    }

    private void setupClickListeners() {
        binding.btnBack.setOnClickListener(v -> {
            NavHostFragment.findNavController(this).popBackStack();
        });

        binding.btnToggleFlash.setOnClickListener(v -> {
            // Toggle torch state using boolean flag
            if (isTorchOn) {
                barcodeView.setTorchOff();
                binding.btnToggleFlash.setImageResource(R.drawable.ic_flash_off);
                isTorchOn = false;
            } else {
                barcodeView.setTorchOn();
                binding.btnToggleFlash.setImageResource(R.drawable.ic_flash_on);
                isTorchOn = true;
            }
        });
    }

    private void checkCameraPermission() {
        if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {

            requestCameraPermission.launch(Manifest.permission.CAMERA);

        } else {
            startScanning();
        }
    }

    private void startScanning() {
        barcodeView.resume();
    }

    private void stopScanning() {
        barcodeView.pause();
    }

    @Override
    public void barcodeResult(BarcodeResult result) {
        String qrData = result.getText();
        if (qrData != null && !qrData.isEmpty()) {
            handleQRCodeResult(qrData);
        }
    }

    @Override
    public void possibleResultPoints(List<com.google.zxing.ResultPoint> resultPoints) {
        // Optional: Handle possible result points for visual feedback
    }

    private void handleQRCodeResult(String qrData) {
        if (isScanHandled) return;
        isScanHandled = true;

        stopScanning();

        vibrate();

        Bundle result = new Bundle();
        result.putString("qr_result", qrData);
        getParentFragmentManager().setFragmentResult("qr_key", result);

        NavHostFragment.findNavController(this).popBackStack();
    }

    private void vibrate() {
        Context context = getContext();
        if (context == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager vm =
                    (VibratorManager) context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);

            if (vm != null) {
                vm.getDefaultVibrator().vibrate(
                        VibrationEffect.createOneShot(200, VibrationEffect.DEFAULT_AMPLITUDE)
                );
            }

        } else {
            Vibrator v =
                    (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);

            if (v == null) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(
                        VibrationEffect.createOneShot(200, VibrationEffect.DEFAULT_AMPLITUDE)
                );
            } else {
                // fallback cho API < 26
                long[] pattern = {0, 200};
                v.vibrate(pattern, -1);
            }
        }
    }

    private final ActivityResultLauncher<String> requestCameraPermission =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
                if (isGranted != null && isGranted) {
                    startScanning();
                } else {
                    Toast.makeText(requireContext(),
                            getString(R.string.camera_permission_required),
                            Toast.LENGTH_LONG).show();

                    NavHostFragment.findNavController(this).popBackStack();
                }
            });

}
