import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PaginationResult } from '../../../class/common/pagination-result.class';
import { RoomDto } from '../../../class/MD/room.class';
import { RoomItemDto } from '../../../class/MD/roomItem.class';
import { GlobalService } from '../../../services/common/global.service';
import { RoomService } from '../../services/room.service';
import { NgModule } from '../../../shared/ng-zorro.module';

@Component({
  selector: 'app-room',
  imports: [NgModule],
  templateUrl: './room.html',
  styleUrl: './room.scss'
})
export class Room implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  visible: boolean = false;
  isEdit: boolean = false;
  data: PaginationResult = new PaginationResult();
  dto: RoomDto = new RoomDto();
  filter: RoomDto = new RoomDto();

  // Canvas & Design properties
  roomItems: RoomItemDto[] = [];
  selectedItem: RoomItemDto | null = null;
  draggedItem: RoomItemDto | null = null;
  offset = { x: 0, y: 0 };
  itemIdCounter = 0;
  canvasWidth = 800;
  canvasHeight = 600;
  constructor(private global: GlobalService, private service: RoomService) {
    this.global.setBreadcrumb([
      {
        name: 'Phòng họp',
        path: 'master-data/room',
      },
    ]);
  }

  ngOnInit(): void {
    this.search();
  }

  search() {
    this.service.search(this.filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.data = res;
        }
      });
  }

  trackById(index: number, item: any): any {
    return item.id || item.code;
  }

  open(data: any, isEdit: boolean) {
    this.isEdit = isEdit;
    if (isEdit) {
      this.service.getDetail(data.code)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            this.dto = res;
            this.roomItems = res.items || [];
            this.canvasWidth = Number(res.width) || 800;
            this.canvasHeight = Number(res.height) || 600;

            console.log('Loaded canvas size:', this.canvasWidth, 'x', this.canvasHeight);

            // Calculate max item ID
            if (this.roomItems.length > 0) {
              const maxId = Math.max(...this.roomItems
                .map(item => parseInt(item.id?.split('-')[1] || '0'))
                .filter(num => !isNaN(num)));
              this.itemIdCounter = maxId;
            }

            this.visible = true;
          }
        });
    } else {
      this.visible = true;
      this.dto = new RoomDto();
      this.dto.isActive = true;
      this.dto.chairCount = 8;
      this.roomItems = [];
      this.itemIdCounter = 0;
      this.canvasWidth = 800;
      this.canvasHeight = 600;
    }
  }

  close() {
    this.visible = false;
    this.dto = new RoomDto();
    this.roomItems = [];
    this.selectedItem = null;
  }

  save() {
    this.dto.width = this.canvasWidth.toString();
    this.dto.height = this.canvasHeight.toString();
    this.dto.items = this.roomItems;

    const action = this.isEdit ? 'update' : 'insert';
    this.service[action](this.dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.search();
          if (!this.isEdit) {
            this.dto = new RoomDto();
            this.roomItems = [];
          }
        }
      });
  }

  reset() {
    this.filter = new RoomDto();
    this.search();
  }

  pageIndexChange(e: any) {
    this.filter.currentPage = e;
    this.search();
  }

  pageSizeChange(e: any) {
    this.filter.pageSize = e;
    this.search();
  }

  // Helper methods for table display
  getTableCount(item: RoomDto): number {
    return (item.items || []).filter(i => i.type === 'table').length;
  }

  getChairCount(item: RoomDto): number {
    return (item.items || []).filter(i => i.type === 'chair').length;
  }

  // ==================== CANVAS METHODS ====================

addTableWithChairs(): void {
  if (!this.dto.tableType) {
    this.global.showWarning('Vui lòng chọn kiểu bàn!');
    return;
  }

  const currentCanvasWidth = Number(this.canvasWidth) || 800;
  const currentCanvasHeight = Number(this.canvasHeight) || 600;

  // Scale cơ bản theo kích thước canvas
  const scaleFactorW = currentCanvasWidth / 800;
  const scaleFactorH = currentCanvasHeight / 600;
  const baseScale = Math.min(scaleFactorW, scaleFactorH);

  // Số ghế
  const chairCount = Number(this.dto.chairCount) || 0;

  // Mở rộng bàn theo số ghế (8 ghế = 1.0, 16 = 1.2, max = 1.8)
  const chairExpansionFactor = Math.min(1 + Math.max(0, chairCount - 8) * 0.02, 1.8);

  // Hệ số phóng to mặc định để bàn nhìn rõ
  const baseZoom = 1.4;

  // Phóng nhẹ theo kích thước canvas
  const canvasZoom = Math.min(1 + (currentCanvasWidth - 800) / 2000, 1.3);

  // Tổng hệ số phóng cho bàn
  const scaleFactor = baseScale * chairExpansionFactor * baseZoom * canvasZoom;

  // Kích thước gốc các loại bàn
  const baseTableSizes: Record<string, { width: number; height: number }> = {
    rectangle: { width: 300, height: 150 },
    round: { width: 180, height: 180 },
    ellipse: { width: 250, height: 130 },
  };

  const baseTableSize = baseTableSizes[this.dto.tableType];
  if (!baseTableSize) {
    this.global.showWarning('Kiểu bàn không hợp lệ!');
    return;
  }

  const tableSize = {
    width: Math.round(baseTableSize.width * scaleFactor),
    height: Math.round(baseTableSize.height * scaleFactor),
  };

  const chairSize = Math.round(45 * baseScale);

  const tableX = Math.round(currentCanvasWidth / 2 - tableSize.width / 2);
  const tableY = Math.round(currentCanvasHeight / 2 - tableSize.height / 2);

  const table = new RoomItemDto();
  table.id = `item-${++this.itemIdCounter}-${this.dto.code}`;
  table.type = 'table';
  table.style = this.dto.tableType;
  table.x = tableX.toString();
  table.y = tableY.toString();
  table.width = tableSize.width.toString();
  table.height = tableSize.height.toString();
  table.rotation = '0';

  this.roomItems.push(table);

  if (chairCount > 0) {
    this.createChairsAroundTable(table, chairCount, chairSize);
  }

}

createChairsAroundTable(table: RoomItemDto, chairCount: number, chairSize: number): void {
  const centerX = parseFloat(table.x) + parseFloat(table.width) / 2;
  const centerY = parseFloat(table.y) + parseFloat(table.height) / 2;

  const currentCanvasWidth = Number(this.canvasWidth) || 800;
  const scaleFactor = currentCanvasWidth / 800;

  const gap = Math.round(20 * scaleFactor);

  const radiusX = parseFloat(table.width) / 2 + chairSize / 2 + gap;
  const radiusY = parseFloat(table.height) / 2 + chairSize / 2 + gap;

  for (let i = 0; i < chairCount; i++) {
    const angle = (i * 2 * Math.PI) / chairCount - Math.PI / 2;
    let chairX: number, chairY: number;

    if (table.style === 'round') {
      const radius = Math.max(radiusX, radiusY);
      chairX = centerX + radius * Math.cos(angle) - chairSize / 2;
      chairY = centerY + radius * Math.sin(angle) - chairSize / 2;
    } else if (table.style === 'ellipse') {
      chairX = centerX + radiusX * Math.cos(angle) - chairSize / 2;
      chairY = centerY + radiusY * Math.sin(angle) - chairSize / 2;
    } else {
      const tableW = parseFloat(table.width);
      const tableH = parseFloat(table.height);
      const tableX = parseFloat(table.x);
      const tableY = parseFloat(table.y);

      const perimeter = 2 * (tableW + tableH);
      const topChairs = Math.max(1, Math.round((tableW / perimeter) * chairCount));
      const rightChairs = Math.max(1, Math.round((tableH / perimeter) * chairCount));
      const bottomChairs = Math.max(1, Math.round((tableW / perimeter) * chairCount));
      const leftChairs = Math.max(0, chairCount - topChairs - rightChairs - bottomChairs);

      if (i < topChairs) {
        // Trên
        const pos = i;
        chairX = tableX + (tableW / (topChairs + 1)) * (pos + 1) - chairSize / 2;
        chairY = tableY - chairSize - gap;
      } else if (i < topChairs + rightChairs) {
        // Phải
        const pos = i - topChairs;
        chairX = tableX + tableW + gap;
        chairY = tableY + (tableH / (rightChairs + 1)) * (pos + 1) - chairSize / 2;
      } else if (i < topChairs + rightChairs + bottomChairs) {
        // Dưới
        const pos = i - topChairs - rightChairs;
        chairX = tableX + (tableW / (bottomChairs + 1)) * (pos + 1) - chairSize / 2;
        chairY = tableY + tableH + gap;
      } else {
        // Trái
        const pos = i - topChairs - rightChairs - bottomChairs;
        chairX = tableX - chairSize - gap;
        chairY = tableY + (tableH / (leftChairs + 1)) * (pos + 1) - chairSize / 2;
      }
    }

    const chair = new RoomItemDto();
    chair.id = `item-${++this.itemIdCounter}-${this.dto.code}`;
    chair.type = 'chair';
    chair.style = 'default';
    chair.x = chairX.toString();
    chair.y = chairY.toString();
    chair.width = chairSize.toString();
    chair.height = chairSize.toString();
    chair.rotation = '0';

    this.roomItems.push(chair);
  }
}


  onItemMouseDown(event: MouseEvent, item: RoomItemDto): void {
    if ((event.target as HTMLElement).closest('.item-controls')) {
      return;
    }

    event.preventDefault();
    this.draggedItem = item;

    const canvas = (event.currentTarget as HTMLElement).closest('.room-canvas') as HTMLElement;
    const rect = canvas.getBoundingClientRect();

    this.offset.x = event.clientX - rect.left - parseFloat(item.x);
    this.offset.y = event.clientY - rect.top - parseFloat(item.y);
  }

  onCanvasMouseMove(event: MouseEvent): void {
    if (!this.draggedItem) return;

    const canvas = event.currentTarget as HTMLElement;
    const rect = canvas.getBoundingClientRect();

    let newX = event.clientX - rect.left - this.offset.x;
    let newY = event.clientY - rect.top - this.offset.y;

    newX = Math.max(0, Math.min(newX, this.canvasWidth - parseFloat(this.draggedItem.width)));
    newY = Math.max(0, Math.min(newY, this.canvasHeight - parseFloat(this.draggedItem.height)));

    this.draggedItem.x = newX.toString();
    this.draggedItem.y = newY.toString();
  }

  onCanvasMouseUp(): void {
    this.draggedItem = null;
  }

  selectItem(item: RoomItemDto, event: Event): void {
    event.stopPropagation();
    this.selectedItem = item;
  }

  rotateItem(item: RoomItemDto, event: Event): void {
    event.stopPropagation();
    const currentRotation = parseInt(item.rotation || '0');
    item.rotation = ((currentRotation + 90) % 360).toString();
  }

  deleteItem(item: RoomItemDto, event: Event): void {
    event.stopPropagation();
    this.roomItems = this.roomItems.filter(i => i.id !== item.id);
    if (this.selectedItem?.id === item.id) {
      this.selectedItem = null;
    }
  }

  deselectItem(): void {
    this.selectedItem = null;
  }

  clearRoom(): void {
    this.global.confirm('Bạn có chắc muốn xóa toàn bộ layout?', () => {
      this.roomItems = [];
      this.selectedItem = null;
    });
  }

  getItemIconType(item: RoomItemDto): string {
    return item.type === 'table' ? 'table' : 'user';
  }

  getControlsRotation(item: RoomItemDto): string {
    const rotation = parseInt(item.rotation || '0');
    return `rotate(${-rotation}deg)`;
  }

  getTypeName(item: RoomItemDto): string {
    return item.type === 'table' ? 'Bàn' : 'Ghế';
  }

  getStyleName(item: RoomItemDto): string {
    if (item.style === 'rectangle') return 'Chữ nhật';
    if (item.style === 'round') return 'Tròn';
    if (item.style === 'ellipse') return 'Elip';
    return 'Mặc định';
  }

  trackByItemId(index: number, item: RoomItemDto): string {
    return item.id || `index-${index}`;
  }

  ngOnDestroy(): void {
    this.global.setBreadcrumb([]);
    this.destroy$.next();
    this.destroy$.complete();
  }
}