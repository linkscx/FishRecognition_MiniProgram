import torch
import torch.nn as nn
from torchvision import models, transforms
from torch.utils.data import DataLoader, Dataset
from PIL import Image
from pathlib import Path
import math
import glob
        
class DirectFishInferDataset(Dataset):
    def __init__(self, image_paths, transform=None):
        self.image_paths = image_paths
        self.transform = transform
    
    def __len__(self):
        return len(self.image_paths)
    
    def __getitem__(self, idx):
        img_path = self.image_paths[idx]
        
        try:
            image = Image.open(img_path).convert('RGB')
            if self.transform:
                image = self.transform(image)
            label = 0 if "对照组" in img_path else 1
            return image, label, img_path
        except:
            print(f"无法打开图像: {img_path}")
            exit(1)

def load_model():
    # 创建模型
    device = torch.device("cpu")
    model = models.resnet18()
    model.fc = nn.Linear(model.fc.in_features, 2)
    model.load_state_dict(torch.load('final_model.pth', map_location='cpu')['model_state_dict'])
    model = model.to(device)
    model.eval()
    return model

def infer(model, open_id=None):
    # img_path = glob.glob(f"./in/**/*.jpg", recursive=True)
    img_path = glob.glob(f"./in/{open_id}/*.jpg", recursive=True)

    # 数据转换
    data_transforms = {
        'val': transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
    }
    
    # 创建数据集
    test_dataset = DirectFishInferDataset(img_path, data_transforms['val'])
    
    # 创建数据加载器
    test_loader = DataLoader(test_dataset, batch_size=1, shuffle=False)
    
    # 设置设备
    device = torch.device("cpu")

    probs = []

    with torch.no_grad():
        for i, (inputs, labels, file_path) in enumerate(test_loader):
            inputs = inputs.to(device)
            outputs = model(inputs)
            prob = nn.Softmax(dim=1)(outputs)
            print(f"{file_path[0]} 预测类别: {torch.argmax(prob, dim=1).item()} 置信度: {prob[0][torch.argmax(prob, dim=1).item()].item():.4f}")
            probs.append(prob)

    avg_prob = torch.mean(torch.stack(probs), dim=0)
    pred = torch.argmax(avg_prob, dim=1).item()
    probability = avg_prob[0][pred].item() * 100
    probability = math.floor(probability * 100) / 100

    return pred, probability

if __name__ == "__main__":
    model = load_model()
    infer(model)