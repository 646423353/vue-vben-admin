import zipfile
import xml.etree.ElementTree as ET

doc_path = r'F:\vue3-project\delivery-insure\apps\web-ele\prd-requirements\E骑保 V2.6 理赔问题和关联优化_A5YRZjEThEsSQfq0QP6zpD\2 案件关联保单：逻辑优化、新增“新职伤”类型保单_LT0m376XENNFk7UqeXdPtC.docx'
out_path = r'F:/vue3-project/delivery-insure/apps/web-ele/prd-requirements/doc2.txt'

try:
    doc = zipfile.ZipFile(doc_path)
    root = ET.fromstring(doc.read('word/document.xml'))
    text = '\n'.join([node.text for node in root.iter() if node.text])
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Extract Success")
except Exception as e:
    print(f"Error: {e}")
