def merge_sort(products, key='id', reverse=False):
    """
    High-Speed Catalog Sorter Engine.
    Sorts product items by catalog field (id, name, price).
    Returns (sorted_products, total_comparisons).
    """
    comparisons = [0]

    def merge(left, right):
        result = []
        i = j = 0
        while i < len(left) and j < len(right):
            comparisons[0] += 1
            left_val = left[i][key]
            right_val = right[j][key]

            if isinstance(left_val, str):
                left_val = left_val.lower()
                right_val = right_val.lower()

            if (left_val <= right_val and not reverse) or (left_val > right_val and reverse):
                result.append(left[i])
                i += 1
            else:
                result.append(right[j])
                j += 1

        result.extend(left[i:])
        result.extend(right[j:])
        return result

    def sort_recursive(arr):
        if len(arr) <= 1:
            return arr
        mid = len(arr) // 2
        left = sort_recursive(arr[:mid])
        right = sort_recursive(arr[mid:])
        return merge(left, right)

    sorted_list = sort_recursive(list(products))
    return sorted_list, comparisons[0]
