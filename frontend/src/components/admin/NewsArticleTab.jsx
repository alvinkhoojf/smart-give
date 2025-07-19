import React, { useState } from "react";
import { Form, Input, Button, Upload, Modal, message, Card } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Editor } from "@tinymce/tinymce-react";
import axios from "axios";
import Swal from 'sweetalert2';


export default function NewsArticleTab() {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [content, setContent] = useState("");

  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url?.substring(file.url.lastIndexOf("/") + 1));
  };
  const handleChangeUpload = ({ fileList: newFileList }) => setFileList(newFileList);
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("You can only upload image files!");
    }
    return isImage || Upload.LIST_IGNORE;
  };
  function getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new window.FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  // Submit to backend
  const onFinish = async (values) => {
    if (!content || content.length < 10) {
      message.error("Article content is required and should be at least 10 characters.");
      return;
    }
    if (fileList.length === 0 || !fileList[0].originFileObj) {
      message.error("Please upload a cover image.");
      return;
    }

    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("content", content);
    formData.append("cover_image", fileList[0].originFileObj);

    try {
      await axios.post("http://localhost:5000/api/admin/news", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      await Swal.fire({
        icon: "success",
        title: "News article created!",
        confirmButtonColor: "#4BB543"
      });
      form.resetFields();
      setContent("");
      setFileList([]);
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Upload failed",
        text: err.message || "An error has occurred.",
        confirmButtonColor: "#FF416C"
      });
    }
  };

  return (
    <div>
      <Card title="Create News Article" style={{ marginBottom: 36 }}>
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item
            label="Title"
            name="title"
            rules={[
              { required: true, message: "Article title is required." },
              { max: 120, message: "Title cannot exceed 120 characters." },
            ]}
          >
            <Input size="large" placeholder="Enter article title" autoComplete="off" />
          </Form.Item>

          <Form.Item
            label="Content"
            required
            help="Write your article content here (at least 10 characters)"
            style={{ marginBottom: 40 }}
          >
            <Editor
              apiKey="p7psf0kbend8wjl3e3r3xrajqjspig5wq4oslq752ehu4z23"
              value={content}
              onEditorChange={setContent}
              init={{
                height: 340,
                menubar: false,
                plugins: [
                  "advlist autolink lists link image",
                  "charmap print preview anchor",
                  "searchreplace visualblocks code",
                  "insertdatetime media table paste wordcount",
                ],
                toolbar:
                  "undo redo | formatselect | bold italic underline | " +
                  "alignleft aligncenter alignright | bullist numlist outdent indent | link | code",
              }}
            />
          </Form.Item>

          <Form.Item
            label="Cover Image"
            required
            help="Upload a main cover image for the news article"
          >
            <Upload.Dragger
              name="cover_image"
              listType="picture-card"
              fileList={fileList}
              onPreview={handlePreview}
              onChange={handleChangeUpload}
              beforeUpload={beforeUpload}
              accept="image/*"
              maxCount={1}
              style={{ marginBottom: 16 }}
              customRequest={({ file, onSuccess }) => {
                // AntD upload prevents auto-upload, let backend handle in onFinish
                setTimeout(() => onSuccess("ok"), 0);
              }}
            >
              <div>
                <PlusOutlined style={{ color: "#FF416C", fontSize: 24 }} />
                <div style={{ marginTop: 8 }}>Click or drag image to upload</div>
                <div style={{ color: "#888", fontSize: 13 }}>PNG, JPG, JPEG, GIF supported</div>
              </div>
            </Upload.Dragger>
            <Modal open={previewOpen} title={previewTitle} footer={null} onCancel={() => setPreviewOpen(false)}>
              <img alt="preview" style={{ width: "100%" }} src={previewImage} />
            </Modal>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" style={{ background: "#FF416C", border: "none", marginTop: 10 }}>
              Publish
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
