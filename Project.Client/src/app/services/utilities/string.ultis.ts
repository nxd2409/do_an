export class StringUtils {
    static decodeUnicodeEscapes(str: string): string {
        return str.replace(/\\u([a-fA-F0-9]{4})/g, (_, g1) =>
            String.fromCharCode(parseInt(g1, 16))
        );
    }

    static removeEmoji(text: string): string {
        this.decodeUnicodeEscapes(text);
        return text.replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g, '');
    }
}