-- 添加营业执照照片字段到companies表
ALTER TABLE companies ADD COLUMN business_license VARCHAR(255);

-- 添加contact_info字段到companies表（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'contact_info') THEN
        ALTER TABLE companies ADD COLUMN contact_info VARCHAR(255);
    END IF;
END $$;

-- 查看更新后的表结构
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;
