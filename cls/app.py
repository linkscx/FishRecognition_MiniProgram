from flask import Flask, request, jsonify
from predict import load_model_1, load_model_2, infer
import requests
import os
import time

application = Flask(__name__)
# 启动时加载模型，且只执行一次
cls_model_1 = load_model_1()
cls_model_2 = load_model_2()

@application.route("/pattern", methods=['POST'])
def pattern():
    data = request.get_json()
    img_paths = data.get('img_path')
    open_id = data.get('openid')

    # 遍历图片路径列表 下载图片
    folder_path = f'in/{open_id}'
    os.makedirs(folder_path, exist_ok=True)  # 创建文件夹（如果不存在）
    # 遍历图片路径列表下载图片到指定文件夹
    for i, img_path in enumerate(img_paths):
        if img_path:
            local_img_path = f'{folder_path}/image_{i}.jpg'
            try:
                response = requests.get(img_path)
                if response.status_code == 200:
                    with open(local_img_path, 'wb') as f:
                        f.write(response.content)
                else:
                    return jsonify({'success': False}), 400
            except requests.RequestException:
                return jsonify({'success': False}), 500

    
    # 记录开始时间
    start_time = time.time()
    # 这里调用 服务器分析代码
    pred1, pred2, prob = infer(cls_model_1, cls_model_2, open_id)
    # 记录结束时间
    end_time = time.time()
    # 计算执行时间
    execution_time = end_time - start_time
    print(f"执行时间: {execution_time} 秒")#32核心  16.7148859500885 秒

    #删除文件夹
    try:
        for filename in os.listdir(folder_path):
            file_path = os.path.join(folder_path, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
        os.rmdir(folder_path)
    except Exception as e:
        print(f"Error deleting folder {folder_path}: {e}")


    if pred1 is None or pred2 is None or prob is None:
        return jsonify({
            'success': False,
            'message': '识别失败，请检查输入或联系管理员。'
        })
    else:
        form = {
            'type': pred1,
            'shape': pred2,
            'probability': prob
        }
        return jsonify({
            'success': True,
            'form': form
        })


@application.route("/index")
def index():
    return "OK"
    
if __name__ == '__main__':
    application.run(host='0.0.0.0', port=8001, debug=True)  # 确保您的服务器监听所有接口