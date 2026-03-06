// babel-plugin-import-meta.js
module.exports = function () {
  return {
    visitor: {
      MetaProperty(path) {
        if (path.node.meta.name === 'import' && path.node.property.name === 'meta') {
          // 将 import.meta.env.VITE_PREFIX 替换为 process.env.VITE_PREFIX
          if (path.parentPath.isMemberExpression() && 
              path.parentPath.node.property.name === 'env') {
            const envPath = path.parentPath;
            if (envPath.parentPath.isMemberExpression()) {
              const varName = envPath.parentPath.node.property.name;
              envPath.parentPath.replaceWith(
                require('@babel/types').memberExpression(
                  require('@babel/types').identifier('process.env'),
                  require('@babel/types').identifier(varName)
                )
              );
            }
          }
        }
      }
    }
  };
};