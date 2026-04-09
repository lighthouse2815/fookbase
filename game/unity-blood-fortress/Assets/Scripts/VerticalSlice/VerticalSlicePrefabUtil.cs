using UnityEngine;

namespace BloodFortress.VerticalSlice
{
    public static class VerticalSlicePrefabUtil
    {
        private static Sprite _pixelSprite;

        public static GameObject CreateSolidBox(
            string name,
            Vector3 position,
            Vector2 size,
            Color color,
            bool withTriggerCollider = false,
            Transform parent = null
        )
        {
            GameObject go = new(name);
            if (parent != null)
            {
                go.transform.SetParent(parent, false);
            }

            go.transform.position = position;
            go.transform.localScale = new Vector3(size.x, size.y, 1f);

            SpriteRenderer renderer = go.AddComponent<SpriteRenderer>();
            renderer.sprite = GetPixelSprite();
            renderer.color = color;

            BoxCollider2D box = go.AddComponent<BoxCollider2D>();
            box.size = Vector2.one;
            box.isTrigger = withTriggerCollider;
            return go;
        }

        public static Sprite GetPixelSprite()
        {
            if (_pixelSprite != null)
            {
                return _pixelSprite;
            }

            Texture2D tex = new(1, 1, TextureFormat.RGBA32, false);
            tex.SetPixel(0, 0, Color.white);
            tex.Apply();

            _pixelSprite = Sprite.Create(tex, new Rect(0, 0, 1, 1), new Vector2(0.5f, 0.5f), 1f);
            _pixelSprite.name = "VerticalSlicePixelSprite";
            return _pixelSprite;
        }
    }
}
