import { memo, useState } from 'react';
import { Dialog, DialogButton, DialogDescription, DialogRoot, DialogTitle } from '~/components/ui/Dialog';
import { classNames } from '~/utils/classNames';

interface GitCloneDialogProps {
  isOpen: boolean;
  isCloning: boolean;
  onClose: () => void;
  onClone: (repoUrl: string, targetDir?: string) => Promise<void>;
}

export const GitCloneDialog = memo(({ isOpen, isCloning, onClose, onClone }: GitCloneDialogProps) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [targetDir, setTargetDir] = useState('');
  const [urlError, setUrlError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repoUrl.trim()) {
      setUrlError('请输入仓库 URL');
      return;
    }

    setUrlError('');
    
    try {
      await onClone(repoUrl.trim(), targetDir.trim() || undefined);
      // 成功后清空表单
      setRepoUrl('');
      setTargetDir('');
    } catch (error) {
      // 错误处理已在父组件中完成
    }
  };

  const handleClose = () => {
    if (!isCloning) {
      setRepoUrl('');
      setTargetDir('');
      setUrlError('');
      onClose();
    }
  };

  const commonRepos = [
    {
      name: 'React Starter',
      url: 'https://github.com/facebook/create-react-app.git',
      description: 'React 官方脚手架'
    },
    {
      name: 'Vue.js Starter',
      url: 'https://github.com/vuejs/create-vue.git',
      description: 'Vue.js 官方脚手架'
    },
    {
      name: 'Next.js Examples',
      url: 'https://github.com/vercel/next.js.git',
      description: 'Next.js 示例项目'
    },
    {
      name: 'Vite Templates',
      url: 'https://github.com/vitejs/vite.git',
      description: 'Vite 模板集合'
    }
  ];

  return (
    <DialogRoot open={isOpen}>
      <Dialog onBackdrop={handleClose} onClose={handleClose}>
        <DialogTitle>从 Git 仓库克隆代码</DialogTitle>
        <DialogDescription asChild>
          <div className="space-y-4">
            <p className="text-sm text-bolt-elements-textSecondary">
              输入 Git 仓库 URL 来克隆代码到工作台
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="repo-url" className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                  仓库 URL *
                </label>
                <input
                  id="repo-url"
                  type="url"
                  value={repoUrl}
                  onChange={(e) => {
                    setRepoUrl(e.target.value);
                    setUrlError('');
                  }}
                  placeholder="https://github.com/username/repository.git"
                  className={classNames(
                    'w-full px-3 py-2 border rounded-md bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-bolt-elements-borderColorActive',
                    {
                      'border-bolt-elements-borderColor': !urlError,
                      'border-red-500': urlError,
                    }
                  )}
                  disabled={isCloning}
                />
                {urlError && (
                  <p className="mt-1 text-sm text-red-500">{urlError}</p>
                )}
              </div>

              <div>
                <label htmlFor="target-dir" className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                  目标目录 (可选)
                </label>
                <input
                  id="target-dir"
                  type="text"
                  value={targetDir}
                  onChange={(e) => setTargetDir(e.target.value)}
                  placeholder="留空将使用仓库名称"
                  className="w-full px-3 py-2 border border-bolt-elements-borderColor rounded-md bg-bolt-elements-background-depth-1 text-bolt-elements-textPrimary placeholder-bolt-elements-textTertiary focus:outline-none focus:ring-2 focus:ring-bolt-elements-borderColorActive"
                  disabled={isCloning}
                />
              </div>
            </form>

            {/* 常用仓库快捷选择 */}
            <div>
              <h4 className="text-sm font-medium text-bolt-elements-textPrimary mb-2">常用仓库</h4>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                {commonRepos.map((repo) => (
                  <button
                    key={repo.url}
                    type="button"
                    onClick={() => {
                      setRepoUrl(repo.url);
                      setUrlError('');
                    }}
                    disabled={isCloning}
                    className="text-left p-2 rounded border border-bolt-elements-borderColor hover:bg-bolt-elements-background-depth-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium text-sm text-bolt-elements-textPrimary">{repo.name}</div>
                    <div className="text-xs text-bolt-elements-textSecondary">{repo.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogDescription>
        
        <div className="flex justify-end gap-2 px-5 pb-4">
          <DialogButton 
            type="secondary" 
            onClick={handleClose}
            disabled={isCloning}
          >
            取消
          </DialogButton>
          <DialogButton 
            type="primary" 
            onClick={handleSubmit}
            disabled={isCloning || !repoUrl.trim()}
          >
            {isCloning ? (
              <div className="flex items-center gap-2">
                <div className="i-svg-spinners:90-ring-with-bg text-sm" />
                克隆中...
              </div>
            ) : (
              '克隆仓库'
            )}
          </DialogButton>
        </div>
      </Dialog>
    </DialogRoot>
  );
});