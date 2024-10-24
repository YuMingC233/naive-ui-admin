import { h, ref } from 'vue';
import { NTag, NUpload } from 'naive-ui';
import { BasicColumn } from '@/components/Table';
import { useGlobSetting } from '@/hooks/setting';

const globSetting = useGlobSetting();
const { uploadUrl: basicUploadUrl } = globSetting;
let isUploading = false;

export interface ListData {
  id: number;
  name: string;
  sex: string;
  avatar: string;
  email: string;
  city: string;
  status: string;
  type: string;
  createDate: string;
  goodsName: string;
  goodsVideo: string;
  goodsImages: string;
  imageList: any;
  uploadUrl: string;
}

const getImageList = (row) => {
  return ref(
    row.goodsImages != null
      ? [
          {
            url: row.goodsImages,
            name: getFileName(row.goodsImages),
            status: 'finished',
          },
        ]
      : []
  );
};

const sexMap = {
  male: '男',
  female: '女',
  unknown: '未知',
};

const statusMap = {
  close: '已取消',
  refuse: '已拒绝',
  pass: '已通过',
};

export const columns: BasicColumn<ListData>[] = [
  {
    title: 'id',
    key: 'id',
  },
  {
    title: '名称',
    key: 'name',
  },
  {
    title: '头像',
    key: 'avatar',
    render(row) {
      const uploadUrl = ref(row.uploadUrl || '');
      const imageList = row.imageList || getImageList(row);

      // 该位置的jsx写法无法正常使用该组件
      return h(NUpload, {
        max: 1,
        // action: uploadUrl, 需求写法，经测试该值在行变化时能正确获取并重新被渲染
        action: basicUploadUrl + '/api/image.ali', // 固定演示写法，用于排除地址问题
        fileList: imageList.value,
        accept: '.jpg,.jpeg,.png,.svg,.webp,.jfif',
        listType: 'image-card',
        onBeforeUpload: (data) => beforeUpload(data, row),
        onFinish: onUploadFinish,
        onChange: (info) => {
          console.log('Upload progress', info);
          // 可以在这里添加更多的状态监控
        },
        onError: (error) => {
          console.error('Upload error:', error);
          isUploading = false;
        },
      });
    },
  },
  {
    title: '性别',
    key: 'sex',
    render(record) {
      return h(
        NTag,
        {
          type: record.sex === 'male' ? 'info' : 'error',
        },
        {
          default: () => sexMap[record.sex],
        }
      );
    },
  },
  {
    title: '邮箱',
    key: 'email',
    width: 220,
  },
  {
    title: '城市',
    key: 'city',
  },
  {
    title: '状态',
    key: 'status',
    render(record) {
      return h(
        NTag,
        {
          type:
            record.status === 'close'
              ? 'default'
              : record.status === 'refuse'
              ? 'error'
              : 'success',
        },
        {
          default: () => statusMap[record.status],
        }
      );
    },
  },
  {
    title: '创建时间',
    key: 'createDate',
  },
];

const beforeUpload = async (data: { file: UploadFileInfo; fileList: UploadFileInfo[] }, row) => {
  if (data.file.file?.size > 20000000 && data.file.file?.type.includes('video')) {
    message.error('视频大小不能超过20M！');
    return false;
  } else if (data.file.file?.size > 10000000 && data.file.file?.type.includes('image')) {
    message.error('图片大小不能超过10M！');
    return false;
  }

  try {
    // 上传地址赋值
    row.uploadUrl = basicUploadUrl + data.file.file?.name + '&checkType=0';
    isUploading = true;
    return true;
  } catch (error) {
    console.error('Upload preparation failed:', error);
    return false;
  }
};

function onUploadFinish(options: { file: UploadFileInfo; event?: ProgressEvent }) {
  try {
    const ResponseJSON = JSON.parse(options.event?.target?.response || '{}');
    const resultUrl = ResponseJSON.result;
    if (resultUrl) {
      options.file.url = resultUrl;
      isUploading = false;
      return options.file;
    } else {
      console.error('No result URL in response');
      return false;
    }
  } catch (error) {
    console.error('Error processing upload response:', error);
    return false;
  }
}
