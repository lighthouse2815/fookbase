using System;
using System.IO;
using BloodFortress.VerticalSlice;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace BloodFortress.EditorTools
{
    public static class VerticalSliceBuildTools
    {
        private const string SceneAssetPath = "Assets/Scenes/BloodFortressWebGL.unity";

        [MenuItem("BloodFortress/Build/Build WebGL (Frontend Public)")]
        public static void BuildWebGLToFrontend()
        {
            BuildWebGLInternal(GetDefaultOutputPath());
        }

        // Used by -executeMethod from batchmode.
        public static void BuildWebGLCI()
        {
            string output = GetArgument("-buildOutput", GetDefaultOutputPath());
            BuildWebGLInternal(output);
        }

        [MenuItem("BloodFortress/Build/Recreate Vertical Slice Scene")]
        public static void RecreateScene()
        {
            string path = EnsureSceneAsset();
            UnityEngine.Debug.Log($"Vertical slice scene prepared at: {path}");
        }

        private static void BuildWebGLInternal(string outputPath)
        {
            if (EditorApplication.isCompiling || EditorApplication.isUpdating)
            {
                throw new InvalidOperationException(
                    "Scripts are still compiling. Wait until compilation finishes, then run build again."
                );
            }

            string scenePath = EnsureSceneAsset();

            string normalizedOutput = Path.GetFullPath(outputPath);
            Directory.CreateDirectory(normalizedOutput);

            BuildPlayerOptions options = new()
            {
                scenes = new[] { scenePath },
                locationPathName = normalizedOutput,
                target = BuildTarget.WebGL,
                options = BuildOptions.None
            };

            BuildReport report = BuildPipeline.BuildPlayer(options);
            if (report.summary.result != BuildResult.Succeeded)
            {
                throw new Exception($"WebGL build failed: {report.summary.result}. See Editor.log for details.");
            }

            UnityEngine.Debug.Log(
                $"WebGL build succeeded. Size: {report.summary.totalSize} bytes. Output: {normalizedOutput}"
            );
        }

        private static string EnsureSceneAsset()
        {
            string sceneAbsPath = Path.GetFullPath(Path.Combine(Application.dataPath, "..", SceneAssetPath));
            string sceneDir = Path.GetDirectoryName(sceneAbsPath) ?? throw new InvalidOperationException("Invalid scene path.");
            Directory.CreateDirectory(sceneDir);

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            GameObject camGo = new("Main Camera");
            camGo.tag = "MainCamera";
            Camera camera = camGo.AddComponent<Camera>();
            camera.orthographic = true;
            camera.orthographicSize = 5.3f;
            camera.backgroundColor = new Color(0.03f, 0.02f, 0.04f, 1f);
            camGo.AddComponent<AudioListener>();
            camGo.AddComponent<VerticalSliceCameraFollow>();

            GameObject director = new("VerticalSliceDirector");
            director.AddComponent<VerticalSliceDirector>();

            EditorSceneManager.SaveScene(scene, SceneAssetPath);
            AssetDatabase.Refresh();
            return SceneAssetPath;
        }

        private static string GetDefaultOutputPath()
        {
            // Application.dataPath -> <repo>/game/unity-blood-fortress/Assets
            return Path.GetFullPath(
                Path.Combine(
                    Application.dataPath,
                    "..",
                    "..",
                    "..",
                    "frontend",
                    "public",
                    "unity",
                    "hiep-si-dang-phao-dai-mau"
                )
            );
        }

        private static string GetArgument(string key, string fallback)
        {
            string[] args = Environment.GetCommandLineArgs();
            for (int i = 0; i < args.Length - 1; i++)
            {
                if (args[i] == key)
                {
                    return args[i + 1];
                }
            }

            return fallback;
        }
    }
}
