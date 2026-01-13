export class TreeUtils {
    static buildNzMenuTree(list: any[]): any[] {
        const build = (parentId: string, level: number): any[] => {
            return list
                .filter(item => item.pId === parentId)
                .sort((a, b) => a.orderNumber - b.orderNumber)
                .map(item => {
                    const children = build(item.id, level + 1);
                    return {
                        key: item.id,
                        title: item.name,
                        ...item,
                        level,
                        children: children.length > 0 ? children : null
                    };
                });
        };

        return build('MNU', 1);
    }

    static buildNzRightTree(list: any[]): any[] {
        const build = (parentId: string, level: number): any[] => {
            return list
                .filter(item => item.pId === parentId)
                .sort((a, b) => a.orderNumber - b.orderNumber)
                .map(item => {
                    const children = build(item.id, level + 1);
                    return {
                        key: item.id,
                        title: item.name,
                        ...item,
                        level,
                        children: children.length > 0 ? children : null
                    };
                });
        };

        return build('RIGHT', 1);
    }

    static buildNzConfigStructTree(list: any[]): any[] {
        const build = (parentId: string, level: number): any[] => {
            return list
                .filter(item => item.pId === parentId)
                .sort((a, b) => a.orderNumber - b.orderNumber)
                .map(item => {
                    const children = build(item.id, level + 1);
                    return {
                        key: item.id,
                        title: item.name,
                        ...item,
                        level,
                        children: children.length > 0 ? children : null
                    };
                });
        };

        return build('STRUCT', 1);
    }

    static buildNzOrgTree(list: any[]): any[] {
        const build = (parentId: string, level: number): any[] => {
            return list
                .filter(item => item.pId === parentId)
                .sort((a, b) => a.orderNumber - b.orderNumber)
                .map(item => {
                    const children = build(item.id, level + 1);
                    return {
                        key: item.id,
                        title: item.name,
                        ...item,
                        level,
                        children: children.length > 0 ? children : null
                    };
                });
        };

        return build('ORG', 1);
    }

    static buildNzPrjectTree(list: any[]): any[] {
        const build = (parentId: string, level: number): any[] => {
            return list
                .filter(item => item.pId === parentId)
                .sort((a, b) => a.orderNumber - b.orderNumber)
                .map(item => {
                    const children = build(item.id, level + 1);
                    return {
                        key: item.id,
                        title: item.name,
                        ...item,
                        level,
                        children: children.length > 0 ? children : null
                    };
                });
        };

        return build('STRUCT_PROJECT', 1);
    }


    static flattenTree(nodes: any[]): any[] {
        let result: any[] = [];
        nodes.forEach(node => {
            const { children, ...rest } = node;
            result.push(rest);
            if (node.children && node.children.length > 0) {
                result = result.concat(this.flattenTree(node.children));
            }
        });
        return result;
    }
}